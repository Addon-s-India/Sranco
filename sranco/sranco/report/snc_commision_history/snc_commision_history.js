// Copyright (c) 2023, Dinesh Panchal and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["SNC Commision History"] = {
  onload: function (report) {
    // Add fields for By Percent and By Amount
    report.page.add_field({
      fieldname: "by_percent_commission",
      label: __("By Commission Percent + / -"),
      fieldtype: "Float",
    });

    report.page.add_field({
      fieldname: "by_amount_commission",
      label: __("By Commission Amount + / -"),
      fieldtype: "Currency",
    });

    // Add Apply button
    report.page.add_button(__("Update Commission"), function () {
      console.log("Apply Commission button clicked ::::");
      let by_percent_commission =
        report.page.fields_dict.by_percent_commission.get_value();
      let by_amount_commission =
        report.page.fields_dict.by_amount_commission.get_value();

      if (!by_percent_commission && !by_amount_commission) {
        frappe.msgprint(
          __("Please enter either a commission percentage or an amount.")
        );
        return;
      }

      let docnames = report.data.map((row) => row.docname).filter(Boolean);

      frappe.call({
        method: "sranco.api.update_item_commissions",
        args: {
          docnames: JSON.stringify(docnames),
          by_percent: by_percent_commission,
          by_amount: by_amount_commission,
        },
        callback: function (response) {
          if (response.message === "success") {
            console.log("Commissions are updated successfully ::: ");
            frappe.msgprint(__("Commissions updated successfully."));
            report.refresh(); // Reload report to show updated commissions
          } else {
            frappe.msgprint(__("Error updating commissions."));
          }
        },
      });
    });
  },
  filters: [
    {
      fieldname: "from_date",
      label: __("From Date"),
      fieldtype: "Date",
      default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
      reqd: 1,
    },
    {
      fieldname: "to_date",
      label: __("To Date"),
      fieldtype: "Date",
      default: frappe.datetime.get_today(),
      reqd: 1,
    },
    {
      fieldname: "item_code",
      label: __("Item"),
      fieldtype: "Link",
      options: "Item",
    },
    {
      fieldname: "item_name",
      label: __("Item"),
      fieldtype: "Link",
      options: "Item",
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
  ],
};
