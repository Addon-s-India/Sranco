// Copyright (c) 2024, Dinesh Panchal and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["TN Stock Order Tracking Report"] = {
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
            fieldname: "stock_order_no",
            label: __("Stock Order No"),
            fieldtype: "Link",
            options: "Stock Order",
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
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
        },
    ],
};
