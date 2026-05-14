from app.celery_app import celery
from app.supabase_client import get_supabase
from app.tasks.sms import send_sms


def _get_alert_phone(vendor_id: str) -> str | None:
    """Return the alert phone from vendor_settings key='alert_phone', or None."""
    supabase = get_supabase()
    res = (
        supabase.table("vendor_settings")
        .select("value")
        .eq("vendor_id", vendor_id)
        .eq("key", "alert_phone")
        .maybe_single()
        .execute()
    )
    if res.data:
        return res.data["value"]
    return None


def _get_low_stock_products(vendor_id: str) -> list[dict]:
    """Return active products where stock_quantity <= low_stock_alert."""
    supabase = get_supabase()
    res = (
        supabase.table("products")
        .select("name, stock_quantity, low_stock_alert")
        .eq("vendor_id", vendor_id)
        .eq("is_active", True)
        .is_("deleted_at", "null")
        # Supabase JS SDK supports lte filter; Python SDK uses filter()
        .filter("stock_quantity", "lte", "low_stock_alert")
        .order("stock_quantity")
        .execute()
    )
    return res.data


def _build_sms(vendor_name: str, products: list[dict]) -> str:
    lines = [f"[TinyPOS] Low stock alert for {vendor_name}:"]
    for p in products:
        lines.append(
            f"  • {p['name']}: {p['stock_quantity']} left "
            f"(alert at {p['low_stock_alert']})"
        )
    return "\n".join(lines)


@celery.task(bind=True, max_retries=2, default_retry_delay=120)
def check_low_stock(self):
    """Check every vendor for low-stock products and fire SMS alerts."""
    supabase = get_supabase()
    vendors = (
        supabase.table("vendors")
        .select("id, name")
        .eq("is_active", True)
        .execute()
    )

    for vendor in vendors.data:
        vendor_id = vendor["id"]
        vendor_name = vendor["name"]

        products = _get_low_stock_products(vendor_id)
        if not products:
            continue

        phone = _get_alert_phone(vendor_id)
        if not phone:
            # No alert phone configured for this vendor — skip silently
            continue

        message = _build_sms(vendor_name, products)
        send_sms.delay(recipient=phone, message=message)
