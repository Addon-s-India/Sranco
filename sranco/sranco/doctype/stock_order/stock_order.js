// Copyright (c) 2023, Dinesh Panchal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Stock Order", {
    validate: function (frm) {
        $.each(frm.doc.items || [], function (i, item) {
            if (item.qty <= 0) {
                frappe.msgprint(
                    __("Row {0}: Quantity must be greater than 0", [item.idx])
                );
                frappe.validated = false;
                return false;
            }
        });
    },
});

frappe.ui.form.on("Stock Order Items", {
    tn_number: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        // fetch item details from item master and fill in the row
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Item",
                filters: { custom_tn_number: row.tn_number },
                fields: ["name"],
            },
            callback: function (r) {
                if (r.message) {
                    console.log("item code", r.message[0].name);
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "item_code",
                        r.message[0].name
                    );
                    // fetch item price based on customer and item_code and set rate in row
                    frappe.call({
                        method: "frappe.client.get",
                        args: {
                            doctype: "Item Price",
                            filters: {
                                item_code: r.message[0].name,
                                price_list: frm.doc.price_list,
                            },
                            fields: ["price_list_rate"],
                        },
                        callback: function (r) {
                            if (r.message) {
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "rate",
                                    r.message.price_list_rate
                                );
                            }
                        },
                    });
                    frappe.call({
                        method: "frappe.client.get",
                        args: {
                            doctype: "Item",
                            name: r.message[0].name,
                        },
                        callback: function (r) {
                            if (r.message) {
                                console.log("item :: ", r.message);
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "item_name",
                                    r.message.item_name
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "shape",
                                    r.message.custom_shape
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "thickness",
                                    r.message.custom_thickness
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "diameter",
                                    r.message.custom_diameter
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "bore",
                                    r.message.custom_bore
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "speed",
                                    r.message.custom_speed
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "more_dimensions",
                                    r.message.custom_more_dimensions
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "specification",
                                    r.message.custom_specification
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "application",
                                    r.message.custom_application
                                );
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "uom",
                                    r.message.stock_uom
                                );
                                //   from customer_items child table in r.message.customer_items find the ref_code based on frm.doc.customer

                                const customerItemCode =
                                    r.message.customer_items.find(
                                        (item) =>
                                            item.customer_name ==
                                            frm.doc.customer
                                    );
                                console.log(
                                    "customerItemCode",
                                    customerItemCode
                                );
                                if (customerItemCode) {
                                    frappe.model.set_value(
                                        cdt,
                                        cdn,
                                        "customer_item_code",
                                        customerItemCode.ref_code
                                    );
                                }
                            }
                        },
                    });
                }
            },
        });
    },
    item_code: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];

        // Fetch item details from item master using the item_code
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Item",
                name: row.item_code,
            },
            callback: function (r) {
                if (r.message) {
                    console.log("item :: ", r.message);
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "tn_number",
                        r.message.custom_tn_number
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "item_name",
                        r.message.item_name
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "shape",
                        r.message.custom_shape
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "thickness",
                        r.message.custom_thickness
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "diameter",
                        r.message.custom_diameter
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "bore",
                        r.message.custom_bore
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "speed",
                        r.message.custom_speed
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "more_dimensions",
                        r.message.custom_more_dimensions
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "specification",
                        r.message.custom_specification
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "application",
                        r.message.custom_application
                    );
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "uom",
                        r.message.stock_uom
                    );

                    // Fetch item price based on customer and item_code and set rate in row
                    frappe.call({
                        method: "frappe.client.get",
                        args: {
                            doctype: "Item Price",
                            filters: {
                                item_code: row.item_code,
                                price_list: frm.doc.price_list,
                            },
                            fields: ["price_list_rate"],
                        },
                        callback: function (r) {
                            if (r.message) {
                                frappe.model.set_value(
                                    cdt,
                                    cdn,
                                    "rate",
                                    r.message.price_list_rate
                                );
                            }
                        },
                    });

                    const customerItemCode = r.message.customer_items.find(
                        (item) => item.customer_name == frm.doc.customer
                    );
                    console.log("customerItemCode", customerItemCode);
                    if (customerItemCode) {
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "customer_item_code",
                            customerItemCode.ref_code
                        );
                    }
                }
            },
        });
    },
    rate: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, "amount", row.qty * row.rate);
        // update grand total
        calc_grand_total(frm);
    },
    qty: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, "amount", row.qty * row.rate);
        // update grand total
        calc_grand_total(frm);
    },
});

function calc_grand_total(frm) {
    var grand_total = 0;
    $.each(frm.doc.items || [], function (i, item) {
        grand_total += item.amount;
    });
    frm.set_value("grand_total", grand_total);
    refresh_field("grand_total");
}
