from unittest.mock import patch, MagicMock, ANY
from datetime import date


class TestFetchSales:
    def test_queries_supabase_correctly(self):
        mock_supabase = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [
            {"id": "sale-1", "created_at": "2026-05-12", "total_amount": "50000", "payment_method": "cash"},
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        with patch("app.tasks.report.get_supabase", return_value=mock_supabase):
            from app.tasks.report import _fetch_sales
            result = _fetch_sales("vendor-1")

        mock_supabase.table.assert_called_once_with("sales")
        mock_supabase.table.return_value.select.assert_called_once_with("id, created_at, total_amount, payment_method")
        mock_supabase.table.return_value.select.return_value.eq.assert_called_once_with("vendor_id", "vendor-1")
        mock_supabase.table.return_value.select.return_value.eq.return_value.gte.assert_called_once_with("created_at", date.today().isoformat())
        assert result == mock_response.data

    def test_returns_empty_list_when_no_sales(self):
        mock_supabase = MagicMock()
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        with patch("app.tasks.report.get_supabase", return_value=mock_supabase):
            from app.tasks.report import _fetch_sales
            result = _fetch_sales("vendor-1")

        assert result == []


class TestGeneratePdf:
    def test_returns_bytes(self):
        mock_html_instance = MagicMock()
        mock_html_instance.write_pdf.return_value = b"%PDF-1.4 mock pdf content"

        with patch("app.tasks.report.HTML", return_value=mock_html_instance) as mock_html_cls:
            with patch("app.tasks.report.REPORT_TEMPLATE.render", return_value="<html>Test Vendor UGX 0</html>"):
                from app.tasks.report import _generate_pdf
                pdf = _generate_pdf("Test Vendor", [])

        assert pdf == b"%PDF-1.4 mock pdf content"
        mock_html_cls.assert_called_once_with(string="<html>Test Vendor UGX 0</html>")

    def test_includes_sales_data(self):
        mock_html_instance = MagicMock()
        mock_html_instance.write_pdf.return_value = b"%PDF-1.4"

        sales = [
            {"id": "abc123", "created_at": "2026-05-12", "total_amount": "25000", "payment_method": "cash"},
        ]

        with patch("app.tasks.report.HTML", return_value=mock_html_instance) as mock_html_cls:
            with patch("app.tasks.report.REPORT_TEMPLATE.render", return_value="<html>25000 abc123 UGX 25,000</html>") as mock_render:
                from app.tasks.report import _generate_pdf
                _generate_pdf("Vendor", sales)

        mock_render.assert_called_once_with(
            vendor_name="Vendor",
            date=date.today().isoformat(),
            total_sales=1,
            total_revenue=25000.0,
            sales=sales,
        )
        mock_html_cls.assert_called_once_with(string="<html>25000 abc123 UGX 25,000</html>")


class TestUploadPdf:
    def test_uploads_to_supabase_storage(self):
        mock_supabase = MagicMock()
        mock_storage = mock_supabase.storage
        mock_storage.from_.return_value.upload.return_value = None
        mock_storage.from_.return_value.get_public_url.return_value = "https://supabase.co/storage/v1/object/public/reports/reports/vendor-1/2026-05-12.pdf"

        with patch("app.tasks.report.get_supabase", return_value=mock_supabase):
            from app.tasks.report import _upload_pdf
            url = _upload_pdf("vendor-1", b"%PDF-1.4 data")

        mock_storage.from_.assert_called_once_with("reports")
        mock_storage.from_.return_value.upload.assert_called_once_with(
            f"reports/vendor-1/{date.today().isoformat()}.pdf",
            b"%PDF-1.4 data",
            {"content-type": "application/pdf"},
        )
        assert url == "https://supabase.co/storage/v1/object/public/reports/reports/vendor-1/2026-05-12.pdf"


class TestGenerateAndSend:
    def test_skips_vendors_with_no_sales(self):
        mock_supabase = MagicMock()

        mock_vendors_resp = MagicMock()
        mock_vendors_resp.data = [{"id": "v1", "name": "Shop A"}, {"id": "v2", "name": "Shop B"}]
        mock_supabase.table.return_value.select.return_value.execute.return_value = mock_vendors_resp

        mock_sales_resp = MagicMock()
        mock_sales_resp.data = []
        sales_chain = mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.order.return_value
        sales_chain.execute.return_value = mock_sales_resp

        with patch("app.tasks.report.get_supabase", return_value=mock_supabase):
            with patch("app.tasks.report._generate_pdf") as mock_gen:
                with patch("app.tasks.report._upload_pdf") as mock_upload:
                    with patch("app.tasks.report.send_whatsapp") as mock_send:
                        from app.tasks.report import generate_and_send
                        generate_and_send()

        mock_gen.assert_not_called()
        mock_upload.assert_not_called()
        mock_send.delay.assert_not_called()

    def test_generates_and_sends_for_vendors_with_sales(self):
        mock_supabase = MagicMock()

        mock_vendors_resp = MagicMock()
        mock_vendors_resp.data = [{"id": "v1", "name": "My Shop"}]
        mock_supabase.table.return_value.select.return_value.execute.return_value = mock_vendors_resp

        mock_sales_resp = MagicMock()
        mock_sales_resp.data = [{"id": "s1", "created_at": "2026-05-12", "total_amount": "30000", "payment_method": "card"}]
        sales_chain = mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.order.return_value
        sales_chain.execute.return_value = mock_sales_resp

        mock_pdf = b"%PDF-mock"
        mock_pdf_url = "https://storage.example.com/report.pdf"

        with patch("app.tasks.report.get_supabase", return_value=mock_supabase):
            with patch("app.tasks.report._generate_pdf", return_value=mock_pdf) as mock_gen:
                with patch("app.tasks.report._upload_pdf", return_value=mock_pdf_url) as mock_upload:
                    with patch("app.tasks.report.send_whatsapp.delay") as mock_send:
                        from app.tasks.report import generate_and_send
                        generate_and_send()

        mock_gen.assert_called_once_with("My Shop", mock_sales_resp.data)
        mock_upload.assert_called_once_with("v1", mock_pdf)
        mock_send.assert_called_once_with(
            recipient="256700000000",
            pdf_url=mock_pdf_url,
            vendor_name="My Shop",
        )
