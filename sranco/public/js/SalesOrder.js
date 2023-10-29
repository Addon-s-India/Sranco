frappe.ui.form.on("Sales Order", {
  custom_order_confirmation: function (frm) {
    // set custom_order_confirmation value in all the items in Sales Order Item table
    frm.doc.items.forEach(function (item) {
      item.custom_order_confirmation = frm.doc.custom_order_confirmation;
    });
    frm.refresh_field("items");
  },
});

frappe.ui.form.on("Sales Order Item", {
  item_code: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.item_code && frm.doc.customer) {
      // Ensure item_code and customer are present
      frappe.call({
        method: "sranco.api.get_customer_ref_code",
        args: {
          item_code: row.item_code,
          customer: frm.doc.customer,
        },
        callback: function (response) {
          if (response.message) {
            frappe.model.set_value(
              cdt,
              cdn,
              "custom_customer_item_code",
              response.message
            );
          }
        },
      });
    }
  },
});
