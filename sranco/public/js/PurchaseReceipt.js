frappe.ui.form.on("Purchase Receipt", {
  onload: function (frm) {
    console.log("onload");
    frm.fields_dict["items"].grid.get_field("item_code").get_query = function (
      doc,
      cdt,
      cdn
    ) {
      let row = locals[cdt][cdn];
      return {
        query: "sranco.item_code_query.custom_item_query",
        filters: {
          purchase_order: row.purchase_order,
        },
      };
    };
  },
  custom_order_confirmation: function (frm) {
    // Clear existing items
    frm.clear_table("items");
    frm.refresh_field("items");

    // Fetch Purchase Orders based on the custom_order_confirmation field value
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Purchase Order",
        filters: {
          custom_order_confirmation: frm.doc.custom_order_confirmation,
        },
        fields: ["name"], // Adjust fields as needed
      },
      callback: function (r) {
        if (r.message && r.message.length > 0) {
          // Assuming the first matched Purchase Order is the one needed
          frappe.call({
            method: "frappe.client.get",
            args: {
              doctype: "Purchase Order",
              name: r.message[0].name,
            },
            callback: function (res) {
              if (res.message) {
                let purchase_order = res.message;

                // Loop through items in the Purchase Order and add them to the Purchase Receipt
                purchase_order.items.forEach(function (po_item) {
                  let new_row = frm.add_child("items");
                  for (var key in po_item) {
                    if (
                      (po_item.hasOwnProperty(key) && key === "qty") ||
                      key === "item_code" ||
                      key === "description" ||
                      key === "uom" ||
                      key === "rate" ||
                      key === "amount" ||
                      key === "warehouse" ||
                      key === "purchase_order" ||
                      key === "custom_tn_number" ||
                      key === "gst_hsn_code" ||
                      key === "item_group" ||
                      key === "stock_uom" ||
                      key === "conversion_factor" ||
                      key === "schedule_date" ||
                      key === "expense_account" ||
                      key === "cost_center" ||
                      key === "item_name"
                    ) {
                      new_row[key] = po_item[key];
                    } else if (key === "name") {
                      new_row["purchase_order_item"] = po_item["name"];
                    }
                  }
                  // Set the Purchase Order value in each item
                  new_row.purchase_order = purchase_order.name;
                });

                frm.refresh_field("items");
                if (frm.doc.items.length > 0) {
                  auto_update(frm);
                }
                frm.refresh();
              }
            },
          });
        }
      },
    });
  },
  refresh: function (frm) {
    if (
      frm.doc.items &&
      frm.doc.items.length > 0 &&
      frm.doc.items[0].purchase_order
    ) {
      // frm.add_custom_button("Auto Update", function () {
      //   frm.doc.items.forEach(function (item, index) {
      //     if (!item.custom_selected_transport_mode) {
      //       frappe.call({
      //         method: "frappe.client.get_list",
      //         args: {
      //           doctype: "Shipment Tracker",
      //           filters: {
      //             item_code: item.item_code,
      //             tn_number: item.custom_tn_number,
      //             purchase_order: item.purchase_order,
      //             // Add any other necessary filters
      //           },
      //         },
      //         callback: function (response) {
      //           if (response.message) {
      //             response.message.forEach(function (tracker_doc) {
      //               frappe.call({
      //                 method: "frappe.client.get",
      //                 args: {
      //                   doctype: "Shipment Tracker",
      //                   name: tracker_doc.name,
      //                 },
      //                 callback: function (r) {
      //                   console.log(r.message);
      //                   const tracker = r.message;
      //                   tracker.transport_mode_table.forEach(function (
      //                     mode_row
      //                   ) {
      //                     if (mode_row.received_qty === 0) {
      //                       var new_row = frm.add_child("items");
      //                       // Copy all properties from the current item except index and name
      //                       for (var key in item) {
      //                         if (
      //                           item.hasOwnProperty(key) &&
      //                           key !== "idx" &&
      //                           key !== "name"
      //                         ) {
      //                           new_row[key] = item[key];
      //                         } else if (key === "idx") {
      //                           console.log("row index :: ", index);
      //                         }
      //                       }
      //                       // Set additional fields for the new row
      //                       new_row.custom_selected_transport_mode =
      //                         mode_row.mode;
      //                       new_row.qty = mode_row.quantity;
      //                       new_row.custom_shipment_tracker = tracker.name; // Set the shipment tracker doc in the related row
      //                     }
      //                   });
      //                   frm.refresh_field("items");
      //                 },
      //               });
      //             });
      //           }
      //         },
      //       });
      //     }
      //   });
      //   // Remove rows without selected_transport_mode or custom_shipment_tracker
      //   $.each(frm.doc.items || [], function (i, item) {
      //     if (
      //       !item.custom_selected_transport_mode ||
      //       !item.custom_shipment_tracker ||
      //       !item.qty === 0
      //     ) {
      //       frm
      //         .get_field("items")
      //         .grid.grid_rows_by_docname[item.name].remove();
      //     }
      //   });
      //   frm.refresh_field("items");
      // });
    }
  },
  before_submit: function (frm) {
    frm.doc.items.forEach(function (item) {
      // Check for received qty
      if (
        item.custom_selected_transport_mode === "Air" &&
        item.custom_received_air_qty > 0
      ) {
        frappe.msgprint(
          `Item ${item.item_code}: Air quantity is already received.`
        );
        frappe.validated = false;
      }
      if (
        item.custom_selected_transport_mode === "Express" &&
        item.custom_received_express_qty > 0
      ) {
        frappe.msgprint(
          `Item ${item.item_code}: Express quantity is already received.`
        );
        frappe.validated = false;
      }
      if (
        item.custom_selected_transport_mode === "Sea" &&
        item.custom_received_sea_qty > 0
      ) {
        frappe.msgprint(
          `Item ${item.item_code}: Sea quantity is already received.`
        );
        frappe.validated = false;
      }

      // Check if custom_selected_transport_mode is empty
      if (!item.custom_selected_transport_mode) {
        frappe.msgprint(
          `Item ${item.item_code}: Transport mode is not selected.`
        );
        frappe.validated = false;
      }

      // Check if qty is 0
      if (item.qty === 0) {
        frappe.msgprint(`Item ${item.item_code}: Quantity cannot be 0.`);
        frappe.validated = false;
      }

      // Check if shipment tracker link doc is set
      if (!item.custom_shipment_tracker) {
        frappe.msgprint(`Item ${item.item_code}: Shipment Tracker is not set.`);
        frappe.validated = false;
      }

      if (item.custom_selected_transport_mode && item.custom_shipment_tracker) {
        frappe.call({
          method: "sranco.api.update_received_qty_in_shipment_tracker",
          args: {
            shipment_tracker: item.custom_shipment_tracker,
            transport_mode: item.custom_selected_transport_mode,
            received_qty: item.received_qty,
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
  },
});

frappe.ui.form.on("Purchase Receipt Item", {
  // Trigger when a new row is added to the "Purchase Receipt Item" table
  items_add: function (frm, cdt, cdn) {
    console.log("add");
    if (frm.doc.items && frm.doc.items.length > 1) {
      const first_row_purchase_order = frm.doc.items[0].purchase_order;
      const new_row = locals[cdt][cdn];
      frappe.model.set_value(
        new_row.doctype,
        new_row.name,
        "purchase_order",
        first_row_purchase_order
      );
    }
  },
  item_code: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (row.purchase_order && row.item_code) {
      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Purchase Order",
          name: row.purchase_order,
        },
        callback: function (response) {
          if (response.message) {
            let purchase_order = response.message;
            let matched_item = purchase_order.items.find(
              (item) => item.item_code === row.item_code
            );

            if (matched_item) {
              frappe.model.set_value(
                cdt,
                cdn,
                "custom_shipped_qty",
                matched_item.custom_shipped_qty
              );
            }
          }
        },
      });
    }
  },
  qty: function (frm, cdt, cdn) {
    validate_combined_qty(frm, cdt, cdn);
    let row = locals[cdt][cdn];
    if (row.custom_shipped_qty < row.qty) {
      frappe.model.set_value(cdt, cdn, "qty", 0);
      frappe.msgprint("Accepted Quantity cannot exceed the Shipped Quantity.");
    }
  },
  custom_shipment_tracker: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (row.custom_shipment_tracker) {
      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Shipment Tracker",
          name: row.custom_shipment_tracker,
          filters: {
            item_code: row.item_code,
          },
        },
        callback: function (response) {
          if (response.message) {
            let tracker = response.message;

            // Fetching the qty based on mode and also the received qty
            tracker.transport_mode_table.forEach(function (mode_row) {
              if (mode_row.mode === "Air") {
                frappe.model.set_value(
                  cdt,
                  cdn,
                  "custom_air_qty",
                  mode_row.quantity
                );
                frappe.model.set_value(
                  cdt,
                  cdn,
                  "custom_received_air_qty",
                  mode_row.received_qty
                );
              } else if (mode_row.mode === "Express") {
                frappe.model.set_value(
                  cdt,
                  cdn,
                  "custom_express_qty",
                  mode_row.quantity
                );
                frappe.model.set_value(
                  cdt,
                  cdn,
                  "custom_received_express_qty",
                  mode_row.received_qty
                );
              } else if (mode_row.mode === "Sea") {
                frappe.model.set_value(
                  cdt,
                  cdn,
                  "custom_sea_qty",
                  mode_row.quantity
                );
                frappe.model.set_value(
                  cdt,
                  cdn,
                  "custom_received_sea_qty",
                  mode_row.received_qty
                );
              }
            });
          }
        },
      });
    }
  },

  custom_use_air_qty: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (has_mode_been_used(frm, "Air", row.item_code)) {
      frappe.msgprint(
        "Air quantity for this item code has already been used in another row."
      );
      frappe.validated = false;
      return;
    }
    if (row.custom_received_air_qty > 0) {
      frappe.msgprint("Air quantity is already received. Choose another mode.");
      frappe.model.set_value(cdt, cdn, "qty", 0);
      return;
    }
    frappe.model.set_value(cdt, cdn, "custom_selected_transport_mode", "Air");
    frappe.model.set_value(cdt, cdn, "qty", row.custom_air_qty);
  },

  custom_use_express_qty: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    if (has_mode_been_used(frm, "Express", row.item_code)) {
      frappe.msgprint(
        "Express quantity for this item code has already been used in another row."
      );
      frappe.validated = false;
      return;
    }

    if (row.custom_received_express_qty > 0) {
      frappe.msgprint(
        "Express quantity is already received. Choose another mode."
      );
      frappe.model.set_value(cdt, cdn, "qty", 0);
      return;
    }

    frappe.model.set_value(
      cdt,
      cdn,
      "custom_selected_transport_mode",
      "Express"
    );
    frappe.model.set_value(cdt, cdn, "qty", row.custom_express_qty);
  },

  custom_use_sea_qty: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    if (has_mode_been_used(frm, "Sea", row.item_code)) {
      frappe.msgprint(
        "Sea quantity for this item code has already been used in another row."
      );
      frappe.validated = false;
      return;
    }

    if (row.custom_received_sea_qty > 0) {
      frappe.msgprint("Sea quantity is already received. Choose another mode.");
      frappe.model.set_value(cdt, cdn, "qty", 0);
      return;
    }

    frappe.model.set_value(cdt, cdn, "custom_selected_transport_mode", "Sea");
    frappe.model.set_value(cdt, cdn, "qty", row.custom_sea_qty);
  },
});

function validate_combined_qty(frm, cdt, cdn) {
  let row = locals[cdt][cdn];
  let total_qty_for_item = 0;

  frm.doc.items.forEach(function (item_row) {
    if (item_row.item_code === row.item_code) {
      total_qty_for_item += item_row.qty;
    }
  });

  if (total_qty_for_item > row.custom_shipped_qty) {
    frappe.msgprint(
      `Total Quantity for ${row.item_code} exceeds the Shipped Quantity.`
    );
    frappe.validated = false;
  }
}

function has_mode_been_used(frm, mode, item_code) {
  return frm.doc.items.some(function (item) {
    return (
      item.item_code === item_code &&
      item.custom_selected_transport_mode === mode
    );
  });
}

function auto_update(frm) {
  frm.doc.items.forEach(function (item, index) {
    if (!item.custom_selected_transport_mode) {
      frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Shipment Tracker",
          filters: {
            item_code: item.item_code,
            tn_number: item.custom_tn_number,
            purchase_order: item.purchase_order,
            // Add any other necessary filters
          },
        },
        callback: function (response) {
          if (response.message) {
            response.message.forEach(function (tracker_doc) {
              frappe.call({
                method: "frappe.client.get",
                args: {
                  doctype: "Shipment Tracker",
                  name: tracker_doc.name,
                },
                callback: function (r) {
                  console.log(r.message);
                  const tracker = r.message;
                  tracker.transport_mode_table.forEach(function (mode_row) {
                    if (mode_row.received_qty === 0) {
                      var new_row = frm.add_child("items");
                      // Copy all properties from the current item except index and name
                      for (var key in item) {
                        if (
                          item.hasOwnProperty(key) &&
                          key !== "idx" &&
                          key !== "name"
                        ) {
                          new_row[key] = item[key];
                        } else if (key === "idx") {
                          console.log("row index :: ", index);
                        }
                      }
                      // Set additional fields for the new row
                      new_row.custom_selected_transport_mode = mode_row.mode;
                      new_row.qty = mode_row.quantity;
                      new_row.custom_shipment_tracker = tracker.name; // Set the shipment tracker doc in the related row
                    } else {
                      frappe.msgprint(
                        `Item <b>${item.item_code}</b> Mode <b>${mode_row.mode}</b>: All quantities are already received.`
                      );
                    }
                  });
                  frm.refresh_field("items");
                },
              });
            });
          }
        },
      });
    }
  });

  // Remove rows without selected_transport_mode or custom_shipment_tracker
  $.each(frm.doc.items || [], function (i, item) {
    if (
      !item.custom_selected_transport_mode ||
      !item.custom_shipment_tracker ||
      !item.qty === 0
    ) {
      frm.get_field("items").grid.grid_rows_by_docname[item.name].remove();
    }
  });

  frm.refresh_field("items");
}
