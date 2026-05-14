import io
import tempfile
from datetime import date, timezone
from pathlib import Path

import httpx
from jinja2 import Template
from weasyprint import HTML

from app.celery_app import celery
from app.config import settings
from app.supabase_client import get_supabase
from app.tasks.whatsapp import send_whatsapp


REPORT_TEMPLATE = Template("""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 11px; padding: 20px; }
  h1 { text-align: center; color: #333; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
  th { background: #f5f5f5; }
  .summary { margin: 12px 0; }
  .summary dt { font-weight: bold; float: left; width: 200px; }
</style></head>
<body>
  <h1>{{ vendor_name }}</h1>
  <p style="text-align:center">Daily Sales Report — {{ date }}</p>
  <dl class="summary">
    <dt>Total Sales</dt><dd>{{ total_sales }}</dd>
    <dt>Total Revenue</dt><dd>UGX {{ "{:,.0f}".format(total_revenue) }}</dd>
  </dl>
  <table>
    <tr><th>Order</th><th>Time</th><th>Amount</th><th>Payment</th></tr>
    {% for s in sales %}
    <tr>
      <td>{{ s.id[:8].upper() }}</td>
      <td>{{ s.created_at[:10] }}</td>
      <td>UGX {{ "{:,.0f}".format(s.total_amount | float) }}</td>
      <td>{{ s.payment_method }}</td>
    </tr>
    {% endfor %}
  </table>
</body></html>
""")


def _fetch_sales(vendor_id: str) -> list[dict]:
    supabase = get_supabase()
    today = date.today().isoformat()
    res = supabase.table("sales") \
        .select("id, created_at, total_amount, payment_method") \
        .eq("vendor_id", vendor_id) \
        .gte("created_at", today) \
        .order("created_at", desc=True) \
        .execute()
    return res.data


def _generate_pdf(vendor_name: str, sales: list[dict]) -> bytes:
    total_revenue = sum(float(s["total_amount"]) for s in sales)
    html = REPORT_TEMPLATE.render(
        vendor_name=vendor_name,
        date=date.today().isoformat(),
        total_sales=len(sales),
        total_revenue=total_revenue,
        sales=sales,
    )
    return HTML(string=html).write_pdf()


def _upload_pdf(vendor_id: str, pdf_bytes: bytes) -> str:
    supabase = get_supabase()
    file_path = f"reports/{vendor_id}/{date.today().isoformat()}.pdf"
    supabase.storage.from_("reports").upload(
        file_path,
        pdf_bytes,
        {"content-type": "application/pdf"},
    )
    res = supabase.storage.from_("reports").get_public_url(file_path)
    return res


@celery.task(bind=True, max_retries=3, default_retry_delay=300)
def generate_and_send(self):
    supabase = get_supabase()
    vendors = supabase.table("vendors") \
        .select("id, name") \
        .execute()

    for vendor in vendors.data:
        sales = _fetch_sales(vendor["id"])
        if not sales:
            continue

        pdf_bytes = _generate_pdf(vendor["name"], sales)
        pdf_url = _upload_pdf(vendor["id"], pdf_bytes)
        recipient = settings.green_api_phone

        send_whatsapp.delay(
            recipient=recipient,
            pdf_url=pdf_url,
            vendor_name=vendor["name"],
        )
