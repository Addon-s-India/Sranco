// Copyright (c) 2023, Dinesh Panchal and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Shipment Tracking Report"] = {
  filters: [
    {
      fieldname: "order_confirmation",
      label: __("Order Confirmation"),
      fieldtype: "Data",
    },
    {
      fieldname: "tn_number",
      label: __("TN Number"),
      fieldtype: "Data",
    },
    {
      fieldname: "customer",
      label: __("Customer"),
      fieldtype: "Link",
      options: "Customer",
    },
    {
      fieldname: "from_date",
      label: __("From Date"),
      fieldtype: "Date",
      default: frappe.datetime.add_days(frappe.datetime.get_today(), -30),
    },
    {
      fieldname: "to_date",
      label: __("To Date"),
      fieldtype: "Date",
      default: frappe.datetime.get_today(),
    },
    {
      fieldname: "show_eod_expired",
      label: __("Show EOD expired"),
      fieldtype: "Check",
      default: 1, // This ensures the checkbox is ticked by default
    },
  ],
};
