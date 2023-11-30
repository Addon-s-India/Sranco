frappe.ui.form.on("Stock Order", {
  before_submit: function (frm) {
    // Check if order_confirmation is empty when trying to submit
    if (!frm.doc.order_confirmation) {
      frappe.msgprint(__("Please enter the Order Confirmation."));
      frappe.validated = false; // Prevent submission
    }
  },
  before_save: function (frm) {
    // copy frm.doc.order_confirmation to all the items in items table
    frm.doc.items.forEach(function (item) {
      item.order_confirmation = frm.doc.order_confirmation;
    });
    frm.refresh_field("items");
    frm.save();
  },
});
