# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class SNCCommissionStatement(Document):
	def on_submit(self):
		
		try:
			# Create a new Purchase Invoice
			sales_invoice = frappe.new_doc("Sales Invoice")
			sales_invoice.customer = "Tyrolit"  # Update with actual supplier
			sales_invoice.custom_invoice_no_t = self.statement[0].invoice_no_t

			# Loop through each statement row and create an item in the Purchase Invoice
			for statement_row in self.statement:
				item = sales_invoice.append('items', {})
				item.item_code = "SNC Commission"
				item.qty = 1
				item.rate = statement_row.commission_amount
				item.amount = statement_row.commission_amount
				# Set custom fields
				item.custom_sales_invoice = statement_row.sales_invoice
				item.custom_invoice_no_t = statement_row.invoice_no_t
				item.custom_invoice_customer = statement_row.customer
				# fetch expense_account from item master
				item_data = frappe.get_doc("Item", item.item_code)
				# expense_account value is in the Item Default table
				item.income_account = item_data.item_defaults[0].income_account
    
				# In each sales invoice we need to make the custom_representative_commission_is_paid field as 1
				sales_invoice_item = frappe.get_doc("Sales Invoice", statement_row.sales_invoice)
				sales_invoice_item.custom_snc_commission_statement_generated = 1
				sales_invoice_item.save()
				

			# Other necessary fields of Purchase Invoice should be set here
			sales_invoice.save()
			sales_invoice.submit()
			frappe.msgprint(msg=f"Sales Invoice Created {sales_invoice.name}.", title="Success", indicator='green')
   
		except Exception as e:
			frappe.msgprint(msg=e, title="Error", indicator='red')
			frappe.log_error(f"Error in get_sales_invoice_list: {e}", "Sranco_logs")
			return []

