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
    frm.fields_dict["items"].grid.add_custom_button(
      __("Get Qty from Stock Order"),
      function () {
        get_qty_from_stock_order(frm);
      }
    );
  },
  // refresh: function (frm) {
  //   $.each(cur_frm.doc.items, function (i, item) {
  //     if (item.custom_stock_order.length > 0) {
  //       $("div[data-fieldname=shipping_list]")
  //         .find(format('div.grid-row[data-idx="{0}"]', [item.idx]))
  //         .css({ "background-color": "#FF0000 !important" });
  //       $("div[data-fieldname=shipping_list]")
  //         .find(format('div.grid-row[data-idx="{0}"]', [item.idx]))
  //         .find(".grid-static-col")
  //         .css({ "background-color": "#FF0000 !important" });
  //     }
  //   });

  refresh: function (frm, cdt, cdn) {
    console.log("/////////");
    cur_frm.fields_dict["items"].$wrapper
      .find(".grid-body .rows")
      .find(".grid-row")
      .each(function (i, item) {
        let d =
          locals[cur_frm.fields_dict["items"].grid.doctype][
            $(item).attr("data-name")
          ];
        if (d["custom_stock_order"].length > 0) {
          $(item).find(".grid-row-check").css({ "background-color": "green" });
        }
      });
  },

  custom_order_confirmation: function (frm) {
    // set custom_order_confirmation value in all the items in Sales Order Item table
    frm.doc.items.forEach(function (item) {
      item.custom_order_confirmation = frm.doc.custom_order_confirmation;
    });
    frm.refresh_field("items");
  },
  before_submit: function (frm) {
    // Check if custom_order_confirmation is empty
    if (!frm.doc.custom_order_confirmation) {
      frappe.msgprint(__("Please enter the Order Confirmation."));
      frappe.validated = false; // Prevent submission
    }
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

function get_qty_from_stock_order(frm) {
  if (frm.doc.items.length > 0) {
    console.log("items", frm.doc.items);
    frm.doc.items.forEach(function (item) {
      if (item.custom_tn_number) {
        console.log("tn_number", item.custom_tn_number);
        frappe.call({
          method: "sranco.stock_order.get_qty_from_stock_order",
          args: {
            tn_number: item.custom_tn_number,
            required_qty: item.qty, // Pass item.qty as required_qty
          },
          callback: function (response) {
            console.log("response", response, item.qty);
            if (response.message) {
              if (parseFloat(response.message.qty) === parseFloat(item.qty)) {
                // Quantity matches, use the provided data
                item.custom_stock_order = response.message.stock_order;
                item.purchase_order = response.message.purchase_order;
                item.custom_order_confirmation =
                  response.message.order_confirmation;
              } else if (
                parseFloat(response.message.qty) < parseFloat(item.qty)
              ) {
                const original_item = item;
                // Quantity is less, update the current row with the response qty
                const original_qty = item.qty;
                item.qty = response.message.qty;
                item.custom_stock_order = response.message.stock_order;
                item.purchase_order = response.message.purchase_order;
                item.custom_order_confirmation =
                  response.message.order_confirmation;

                // Create a new row for the remaining quantity
                // Create a new row for the remaining quantity
                var new_item = frm.add_child("items");

                // Copy values from original_item to new_item
                for (var key in original_item) {
                  console.log("key", key, original_item[key]);
                  if (
                    original_item.hasOwnProperty(key) &&
                    key !== "qty" &&
                    key !== "custom_stock_order" &&
                    key !== "purchase_order" &&
                    key !== "custom_order_confirmation" &&
                    key !== "name" &&
                    key !== "idx"
                  ) {
                    new_item[key] = original_item[key];
                  } else if (key === "qty") {
                    console.log("original_qty", original_qty);
                    const remaining_qty =
                      parseFloat(original_qty) -
                      parseFloat(response.message.qty);
                    new_item[key] = remaining_qty;
                  }
                }
              }
              frm.refresh_fields();
            }
          },
        });
      }
      frm.refresh_fields();
    });
  }
}
