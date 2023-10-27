frappe.ui.form.on("Quotation", {
  onload: function (frm) {
    frm.get_field("custom_not_deliverables").grid.cannot_add_rows = true;
    frm.get_field("custom_not_deliverables").grid.cannot_delete_rows = true;
    // On form load, check and create the rows if needed
    $.each(frm.doc.items || [], function (i, item) {
      manage_not_deliverables_row(frm, item);
    });
  },
  refresh: function (frm) {
    frm.get_field("custom_not_deliverables").grid.cannot_add_rows = true;
    frm.get_field("custom_not_deliverables").grid.cannot_delete_rows = true;
    frm.fields_dict["custom_not_deliverables"].grid.wrapper
      .find(".grid-remove-rows")
      .hide();
  },
  validate: function (frm) {
    $.each(frm.doc.items || [], function (i, item) {
      // If custom_not_a_tyrolit_specification is 0, make custom_tn_number mandatory
      if (
        item.custom_not_a_tyrolit_specification == 0 &&
        !item.custom_tn_number
      ) {
        frappe.msgprint(
          __("Please enter TN Number for the item: {0}", [item.item_code])
        );
        frappe.validated = false;
      }
      // Save the custom_tn_number to the related Item document
      if (item.custom_tn_number) {
        frappe.call({
          method: "frappe.client.set_value",
          args: {
            doctype: "Item",
            name: item.item_code,
            fieldname: "custom_tn_number",
            value: item.custom_tn_number,
          },
        });
      }
    });
  },
});

frappe.ui.form.on("Quotation Item", {
  custom_not_a_tyrolit_specification: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    manage_not_deliverables_row(frm, row);

    if (row.custom_not_a_tyrolit_specification == 0) {
      frm.fields_dict["items"].grid.toggle_reqd("custom_tn_number", true);
    }
  },
  custom_snc_commision_: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.custom_snc_commision_type == "Percent") {
      row.custom_snc_commision_amount =
        (row.custom_snc_commision_ * row.price_list_rate) / 100;
      frm.refresh_field("items");
    }
  },
});

function manage_not_deliverables_row(frm, item) {
  if (item.custom_not_a_tyrolit_specification == 1) {
    // Check if a row already exists for this item in 'Not Deliverables' table
    var exists = false;
    $.each(frm.doc.custom_not_deliverables || [], function (i, nd_row) {
      if (nd_row.item_code === item.item_code) {
        exists = true;
      }
    });

    // If row doesn't exist, add a new row and copy custom fields
    if (!exists) {
      var nd = frm.add_child("custom_not_deliverables");
      nd.item_code = item.item_code;
      copy_custom_fields(item, nd);
    }
  } else {
    // Remove the row from 'Not Deliverables' table if it exists
    var rows_to_remove = [];
    $.each(frm.doc.custom_not_deliverables || [], function (i, nd_row) {
      if (nd_row.item_code === item.item_code) {
        rows_to_remove.push(nd_row);
      }
    });

    $.each(rows_to_remove, function (i, row) {
      frm
        .get_field("custom_not_deliverables")
        .grid.grid_rows_by_docname[row.name].remove();
    });
  }

  frm.refresh_field("custom_not_deliverables");
}

function copy_custom_fields(source, target) {
  for (var key in source) {
    if (key.startsWith("custom_")) {
      var new_key = key.replace("custom_", ""); // Removing the 'custom_' prefix
      target[new_key] = source[key];
    }
  }
}
