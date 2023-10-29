frappe.ui.form.on("Sales Order", {
  onload: function (frm) {
    frm.fields_dict["items"].grid.get_field("item_code").get_query = function (
      doc,
      cdt,
      cdn
    ) {
      return {
        query: "sranco.sranco.item_code_query.custom_item_query",
      };
    };
  },

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
