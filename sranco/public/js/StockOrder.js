// frappe.ui.form.on("Stock Order", {
//     onload: function (frm) {
//         frm.fields_dict["items"].grid.get_field("item_code").get_query =
//             function (doc, cdt, cdn) {
//                 return {
//                     query: "sranco.sales_order.custom_item_query",
//                     filters: {
//                         customer: frm.doc.customer,
//                     },
//                 };
//             };
//     },
//     before_submit: function (frm) {
//         // Check if order_confirmation is empty when trying to submit
//         if (!frm.doc.order_confirmation) {
//             frappe.msgprint(__("Please enter the Order Confirmation."));
//             frappe.validated = false; // Prevent submission
//         }
//     },
//     before_save: function (frm) {
//         // copy frm.doc.order_confirmation to all the items in items table
//         if (frm.doc.items.length > 0 && frm.doc.order_confirmation) {
//             frm.doc.items.forEach(function (item) {
//                 item.order_confirmation = frm.doc.order_confirmation;
//             });
//         }
//         frm.refresh_field("items");
//         // frm.save();
//     },
// });
