frappe.ui.form.on("Opportunity", {
  onload: function (frm) {
    // Check visibility on load
    update_field_visibility(frm);
  },
  refresh: function (frm) {
    // Check visibility on refresh
    update_field_visibility(frm);
  },
  before_save: function (frm) {
    frm.doc.items.forEach(function (item) {
      if (
        item.custom_new_enquiry == 1 &&
        (!item.item_code || !item.item_name)
      ) {
        // Call the custom API method to create a new item and update the Opportunity Item
        frappe.call({
          method: "sranco.api.create_new_item",
          args: {
            item_data: item,
          },
          async: false,
          callback: function (response) {
            if (response.message) {
              item.item_code = response.message.item_code;
              item.item_name = response.message.item_name;
            }
          },
        });
      }
    });
    frm.refresh_field("items"); // Refresh the child table to reflect changes
  },
});

frappe.ui.form.on("Opportunity Item", {
  custom_new_enquiry: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    set_field_visibility(row, frm);
  },
});

function update_field_visibility(frm) {
  $.each(frm.doc.items || [], function (i, item) {
    set_field_visibility(item, frm);
  });
}

function set_field_visibility(row, frm) {
  if (row.custom_new_enquiry == 1) {
    frm.fields_dict["items"].grid.toggle_display("item_code", false);
    frm.fields_dict["items"].grid.toggle_display("item_name", false);
  } else {
    frm.fields_dict["items"].grid.toggle_display("item_code", true);
    frm.fields_dict["items"].grid.toggle_display("item_name", true);
  }
}
