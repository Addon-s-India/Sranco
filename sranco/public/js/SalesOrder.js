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
  if (frm.doc.items.length > 0 && frm.doc.docstatus !== 1) {
    console.log("items", frm.doc.items);
    frm.doc.items.forEach(function (original_item) {
      if (original_item.custom_tn_number) {
        console.log("tn_number", original_item.custom_tn_number);
        frappe.call({
          method: "sranco.stock_order.get_qty_from_stock_order",
          args: {
            tn_number: original_item.custom_tn_number,
            required_qty: original_item.qty,
          },
          callback: function (response) {
            console.log("response", response, original_item.qty);
            const itemQty = original_item.qty;
            if (response.message && response.message.length > 0) {
              let totalQtyCovered = 0;
              response.message.forEach(function (stock_order, index) {
                totalQtyCovered += parseFloat(stock_order.qty);

                if (index === 0) {
                  // Update the current row with the first stock order details
                  original_item.qty = stock_order.qty;
                  original_item.custom_stock_order = stock_order.stock_order;
                  original_item.purchase_order = stock_order.purchase_order;
                  original_item.custom_order_confirmation =
                    stock_order.order_confirmation;
                } else {
                  // Create new rows for additional stock orders
                  var new_item = frm.add_child("items");
                  for (var key in original_item) {
                    if (
                      original_item.hasOwnProperty(key) &&
                      ![
                        "qty",
                        "custom_stock_order",
                        "purchase_order",
                        "custom_order_confirmation",
                        "name",
                        "idx",
                      ].includes(key)
                    ) {
                      new_item[key] = original_item[key];
                    }
                  }
                  new_item.qty = stock_order.qty; // Set qty from stock order
                  new_item.custom_stock_order = stock_order.stock_order;
                  new_item.purchase_order = stock_order.purchase_order;
                  new_item.custom_order_confirmation =
                    stock_order.order_confirmation;
                }
              });

              // Check if there is remaining quantity after utilizing all stock orders
              const remainingQty = parseFloat(itemQty) - totalQtyCovered;
              if (remainingQty > 0) {
                var new_item = frm.add_child("items");
                for (var key in original_item) {
                  if (
                    original_item.hasOwnProperty(key) &&
                    ![
                      "qty",
                      "custom_stock_order",
                      "purchase_order",
                      "custom_order_confirmation",
                      "name",
                      "idx",
                    ].includes(key)
                  ) {
                    new_item[key] = original_item[key];
                  }
                }
                new_item.qty = remainingQty; // Set remaining qty
                // Reset stock order related fields for the remaining quantity
                new_item.custom_stock_order = "";
                new_item.purchase_order = "";
                new_item.custom_order_confirmation = "";
              }

              frm.refresh_fields();
              frm.refresh();
            }
          },
        });
      }
    });
  } else {
    frappe.msgprint(__("The sales order is already submitted."));
  }
}
