frappe.ui.form.on("Purchase Receipt", {
  onload: function (frm) {
    frm.fields_dict["items"].grid.get_field("item_code").get_query = function (
      doc,
      cdt,
      cdn
    ) {
      let row = locals[cdt][cdn];
      if (row.purchase_order) {
        return {
          filters: {
            parent: row.purchase_order,
          },
        };
      }
    };
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
            received_qty: item.qty,
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
  item_code: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (row.purchase_order && row.item_code) {
      frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Purchase Order Item",
          filters: {
            parent: row.purchase_order,
            item_code: row.item_code,
          },
          fields: ["custom_shipped_qty"],
        },
        callback: function (response) {
          if (response.message && response.message.length) {
            frappe.model.set_value(
              cdt,
              cdn,
              "custom_shipped_qty",
              response.message[0].custom_shipped_qty
            );
          }
        },
      });
    }
  },
  qty: function (frm, cdt, cdn) {
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

    if (row.custom_received_sea_qty > 0) {
      frappe.msgprint("Sea quantity is already received. Choose another mode.");
      frappe.model.set_value(cdt, cdn, "qty", 0);
      return;
    }

    frappe.model.set_value(cdt, cdn, "custom_selected_transport_mode", "Sea");
    frappe.model.set_value(cdt, cdn, "qty", row.custom_sea_qty);
  },
});
