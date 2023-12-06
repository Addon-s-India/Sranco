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
    if (frm.doc.docstatus !== 1) {
      frm.fields_dict["items"].grid.add_custom_button(
        __("Get Qty from Stock Order"),
        function () {
          get_qty_from_stock_order(frm);
        }
      );
    }

    frm.set_query("custom_stock_order", "items", function (doc, cdt, cdn) {
      var row = locals[cdt][cdn];
      return {
        query: "sranco.stock_order.custom_stock_order_query",
        filters: { item_code: row.item_code, customer: frm.doc.customer },
      };
    });
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
    if (frm.doc.docstatus !== 1) {
      frm.fields_dict["items"].grid.add_custom_button(
        __("Get Qty from Stock Order"),
        function () {
          get_qty_from_stock_order(frm);
        }
      );
    }
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

    frm.set_query("custom_stock_order", "items", function (doc, cdt, cdn) {
      var row = locals[cdt][cdn];
      return {
        query: "sranco.stock_order.custom_stock_order_query",
        filters: { item_code: row.item_code },
      };
    });
  },

  custom_order_confirmation: function (frm) {
    // set custom_order_confirmation value in all the items in Sales Order Item table
    frm.doc.items.forEach(function (item) {
      if (!item.custom_order_confirmation) {
        item.custom_order_confirmation = frm.doc.custom_order_confirmation;
      }
    });
    frm.refresh_field("items");
  },
  before_submit: function (frm) {
    // Check if custom_order_confirmation is empty
    // if (!frm.doc.custom_order_confirmation) {
    //   frappe.msgprint(__("Please enter the Order Confirmation."));
    //   frappe.validated = false; // Prevent submission
    // }
    if (frm.doc.items.length > 0) {
      frm.doc.items.forEach(function (item) {
        if (!item.custom_order_confirmation) {
          frappe.msgprint(
            __("Please enter the Order Confirmation for item " + item.item_code)
          );
          frappe.validated = false; // Prevent submission
        }
      });
    }
  },
});

frappe.ui.form.on("Sales Order Item", {
  refresh(frm) {
    frm.set_query("custom_stock_order", "items", function (doc, cdt, cdn) {
      var row = locals[cdt][cdn];
      return {
        query: "sranco.stock_order.custom_stock_order_query",
        filters: { item_code: row.item_code },
      };
    });
  },
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
  custom_tn_number: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    // fetch item details from item master and fill in the row
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Item",
        filters: { custom_tn_number: row.custom_tn_number },
        fields: ["name"],
      },
      callback: function (r) {
        if (r.message) {
          console.log("item code", r.message[0].name);
          frappe.model.set_value(cdt, cdn, "item_code", r.message[0].name);
          // refresn the item_code field
          frm.refresh_field("items");
        }
      },
    });
  },
  custom_stock_order: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    // fetch item details from item master and fill in the row
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Stock Order",
        filters: { name: row.custom_stock_order, docstatus: 1 },
        fields: ["name", "purchase_order", "order_confirmation"],
        order_by: "creation asc",
      },
      callback: function (r) {
        if (r.message) {
          console.log("stock order", r.message);
          frappe.model.set_value(
            cdt,
            cdn,
            "purchase_order",
            r.message[0].purchase_order
          );
          frappe.model.set_value(
            cdt,
            cdn,
            "custom_order_confirmation",
            r.message[0].order_confirmation
          );
          frappe.call({
            method: "frappe.client.get",
            args: {
              doctype: "Stock Order",
              name: r.message[0].name,
            },
            callback: function (r) {
              if (r.message) {
                console.log("stock order items", r.message.items);
                var item_matched = false;
                r.message.items.forEach(function (item) {
                  console.log("item", item);
                  if (item.item_code === row.item_code) {
                    item_matched = true;
                    frappe.model.set_value(
                      cdt,
                      cdn,
                      "custom_stock_order_item_available_qty",
                      item.qty - item.sales_qty
                    );
                  }
                });
                if (item_matched === false) {
                  frappe.msgprint(
                    __(
                      "There is no item " +
                        row.item_code +
                        " matching in the given order confirmation number."
                    )
                  );
                }
              }
            },
          });
          // refresn the item_code field
          frm.refresh_field("items");
        }
      },
    });
  },
  custom_order_confirmation: function (frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    // fetch item details from item master and fill in the row
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Stock Order",
        filters: {
          order_confirmation: row.custom_order_confirmation,
          docstatus: 1,
        },
        fields: ["name", "purchase_order"],
        order_by: "creation asc",
      },
      callback: function (r) {
        if (r.message) {
          console.log("stock order", r.message);
          frappe.model.set_value(
            cdt,
            cdn,
            "custom_stock_order",
            r.message[0].name
          );

          // get the stock order items
          frappe.call({
            method: "frappe.client.get",
            args: {
              doctype: "Stock Order",
              name: r.message[0].name,
            },
            callback: function (r) {
              if (r.message) {
                console.log("stock order items", r.message.items);
                var item_matched = false;
                r.message.items.forEach(function (item) {
                  console.log("item", item);
                  if (item.item_code === row.item_code) {
                    item_matched = false;
                    frappe.model.set_value(
                      cdt,
                      cdn,
                      "custom_stock_order_item_available_qty",
                      item.qty - item.sales_qty
                    );
                  }
                });
                if (item_matched === false) {
                  frappe.msgprint(
                    __(
                      "There is no item " +
                        row.item_code +
                        " matching in the given order confirmation number."
                    )
                  );
                }
              }
            },
          });

          frappe.model.set_value(
            cdt,
            cdn,
            "purchase_order",
            r.message[0].purchase_order
          );
          // refresn the item_code field
          frm.refresh_field("items");
        }
      },
    });
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
              // refresh items
              frm.refresh();
            }
          },
        });
      }
      frm.refresh_fields();
    });
  }
}
