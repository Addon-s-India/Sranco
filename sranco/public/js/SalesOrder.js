frappe.ui.form.on("Sales Order", {
  custom_order_confirmation: function (frm) {
    // set custom_order_confirmation value in all the items in Sales Order Item table
    frm.doc.items.forEach(function (item) {
      item.custom_order_confirmation = frm.doc.custom_order_confirmation;
    });
    frm.refresh_field("items");
  },
});
