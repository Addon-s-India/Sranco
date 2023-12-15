import frappe
from frappe.utils import logger

logger.set_log_level("DEBUG")
logger = frappe.logger("sranco_logs", allow_site=True, file_count=1)

@frappe.whitelist()
def get_rep_sales_invoice_list(representative, from_date, to_date):
    try:
        # Fetching sales invoices based on the representative and date range
        logger.info(f"Fetching sales invoices based on the representative and date range {representative} {from_date} {to_date}")
        invoices = frappe.db.sql("""
            SELECT si.name AS sales_invoice, si.posting_date AS invoice_date, si.customer, si.custom_total_representative_commission AS commission_amount, si.custom_invoice_no_t as invoice_no_t
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` si_item ON si.name = si_item.parent
            WHERE si_item.custom_representative = %(representative)s
            AND si.custom_representative_commission_statement_generated = 0
            AND si.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND si.docstatus = 1
            GROUP BY si.name
            ORDER BY si.posting_date DESC
            """, {'representative': representative, 'from_date': from_date, 'to_date': to_date}, as_dict=1)

        return invoices

    except Exception as e:
        logger.error(f"Error in get_sales_invoice_list: {e}")
        frappe.log_error(f"Error in get_sales_invoice_list: {e}", "Sranco_logs")
        return []


@frappe.whitelist()
def get_snc_sales_invoice_list(from_date, to_date):
    try:
        # Fetching sales invoices based on the representative and date range
        logger.info(f"Fetching sales invoices based on the representative and date range {from_date} {to_date}")
        invoices = frappe.db.sql("""
            SELECT si.name AS sales_invoice, si.posting_date AS invoice_date, si.customer, si.custom_total_snc_commission AS commission_amount, si.custom_invoice_no_t as invoice_no_t
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` si_item ON si.name = si_item.parent
            AND si.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND si.docstatus = 1
            AND si.custom_snc_commission_statement_generated = 0
            GROUP BY si.name
            ORDER BY si.posting_date DESC
            """, {'from_date': from_date, 'to_date': to_date}, as_dict=1)

        return invoices

    except Exception as e:
        logger.error(f"Error in get_sales_invoice_list: {e}")
        frappe.log_error(f"Error in get_sales_invoice_list: {e}", "Sranco_logs")
        return []
