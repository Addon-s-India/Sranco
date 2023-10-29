frappe.ui.form.on("Opportunity", {
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
    // Check visibility on load
    update_field_visibility(frm);
  },
  refresh: function (frm) {
    // Check visibility on refresh
    update_field_visibility(frm);
  },
  before_save: function (frm) {
    frm.doc.items.forEach(function (item) {
      // Existing logic for custom new enquiry
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

      // New logic for updating ref_code in Customer Items
      if (item.custom_customer_item_code) {
        frappe.call({
          method: "sranco.api.update_customer_item_ref_code",
          args: {
            item_code: item.item_code,
            customer: frm.doc.party_name,
            ref_code: item.custom_customer_item_code,
          },
          async: false,
          callback: function (response) {
            if (!response.exc) {
              frappe.msgprint(response.message);
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
  item_code: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];

    if (row.item_code && frm.doc.party_name) {
      // fetch item price for customer and item code
      frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Item Price",
          filters: {
            item_code: row.item_code,
            customer: frm.doc.party_name,
          },
          fields: ["price_list_rate", "uom"],
        },
        callback: function (response) {
          console.log("response :: ", response.message);
          if (response.message) {
            row.rate = response.message[0].price_list_rate;
            row.uom = response.message[0].uom;
            frm.refresh_field("items");
          }
        },
      });
    }

    if (row.item_code && frm.doc.party_name) {
      // Ensure item_code and party_name (customer) are present
      frappe.call({
        method: "sranco.api.get_customer_ref_code",
        args: {
          item_code: row.item_code,
          customer: frm.doc.party_name,
        },
        callback: function (response) {
          if (response.message) {
            console.log(response.message);
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
