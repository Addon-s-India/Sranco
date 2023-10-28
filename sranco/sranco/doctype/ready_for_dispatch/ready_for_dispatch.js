// Copyright (c) 2023, Dinesh Panchal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Ready For Dispatch", {
  onload: function (frm) {
    frm.get_field("dispatch_table").grid.cannot_add_rows = true;
    frm.get_field("dispatch_table").grid.cannot_delete_rows = true;
    frm.fields_dict["dispatch_table"].grid.wrapper
      .find(".grid-remove-rows")
      .hide();
  },
  refresh: function (frm) {
    frm.get_field("dispatch_table").grid.cannot_add_rows = true;
    frm.get_field("dispatch_table").grid.cannot_delete_rows = true;
    frm.fields_dict["dispatch_table"].grid.wrapper
      .find(".grid-remove-rows")
      .hide();

    frm.add_custom_button("Apply Changes", function () {
      apply_changes_function(frm);
    });
  },
  order_confirmation: function (frm) {
    if (frm.doc.order_confirmation) {
      frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Purchase Order",
          filters: {
            custom_order_confirmation: frm.doc.order_confirmation,
          },
          fields: ["name"],
        },
        callback: function (response) {
          if (response.message && response.message.length) {
            let purchase_order_name = response.message[0].name;
            cur_frm.set_value("purchase_order", purchase_order_name);
            fetch_purchase_order_items(purchase_order_name, frm);
          } else {
            frappe.msgprint(
              "No Purchase Order found with the given Order Confirmation number."
            );
          }
        },
      });
    }
  },
});

frappe.ui.form.on("Dispatch Table", {
  // Assuming "Dispatch Table" is the name of your child table Doctype
  update_ready_qty: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn]; // Get the current row

    if (
      row.update_ready_qty > row.qty - row.ready_qty ||
      row.update_ready_qty < 0
    ) {
      frappe.model.set_value(cdt, cdn, "update_ready_qty", 0); // Resetting the value to 0 or you can keep it to previous value
      frappe.msgprint(
        "Update Ready Quantity cannot exceed the remaining quantity or be negative."
      );
    }

    if (row.qty - row.ready_qty === 0) {
      frappe.msgprint("No more quantity left to update.");
    }
  },
});

function fetch_purchase_order_items(purchase_order_name, frm) {
  frappe.call({
    method: "frappe.client.get",
    args: {
      doctype: "Purchase Order",
      name: purchase_order_name,
    },
    callback: function (response) {
      if (response.message) {
        let purchase_order = response.message;
        cur_frm.set_value("dispatch_table", []);
        cur_frm.set_value("customer", purchase_order.customer);
        //   set purchase order using item.parent
        let sales_order;
        $.each(purchase_order.items, function (index, item) {
          console.log("item", item);
          sales_order = item.sales_order;
          cur_frm.add_child("dispatch_table", {
            sequence_no: item.idx,
            item_name: item.item_name,
            item_code: item.item_code,
            qty: item.qty,
            ready_qty: item.custom_ready_qty,
            customer: purchase_order.customer,
            purchase_order: purchase_order_name,
            sales_order: item.sales_order,
            order_confirmation: frm.doc.order_confirmation,
          });
        });
        cur_frm.set_value("sales_order", sales_order);
        cur_frm.refresh_field("dispatch_table");
      }
    },
  });
}

function apply_changes_function(frm) {
  frappe.call({
    method: "sranco.api.create_gi_date_tracker_and_update_po",
    args: {
      dispatch_data: frm.doc.dispatch_table,
    },
    callback: function (response) {
      if (response.message == "success") {
        frappe.msgprint("Operation completed successfully.");
        frm.reload_doc(); // Reload the document to see updated values
      } else {
        frappe.msgprint("There was an error processing your request.");
      }
    },
  });
}
