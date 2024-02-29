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
    gi_date: function (frm) {
        // set gi_date in all the items
        frm.doc.items.forEach(function (item) {
            item.gi_date = frm.doc.date;
        });
        frm.refresh_field("items");
    },
    items_add: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.gi_date = frm.doc.date;
    },
    onload: function (frm) {
        frm.fields_dict["items"].grid.get_field("item_code").get_query =
            function (doc, cdt, cdn) {
                return {
                    query: "sranco.sales_order.custom_item_query",
                    filters: {
                        customer: frm.doc.customer,
                    },
                };
            };
    },
    before_submit: function (frm) {
        // Check if order_confirmation is empty when trying to submit
        if (!frm.doc.order_confirmation) {
            frappe.msgprint(__("Please enter the Order Confirmation."));
            frappe.validated = false; // Prevent submission
        }
    },
    before_save: function (frm) {
        // copy frm.doc.order_confirmation to all the items in items table
        if (frm.doc.items.length > 0 && frm.doc.order_confirmation) {
            frm.doc.items.forEach(function (item) {
                item.order_confirmation = frm.doc.order_confirmation;
                if (item.gi_date == null) {
                    item.gi_date = frm.doc.date;
                }
            });
        }
        frm.refresh_field("items");
        // frm.save();
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
                    get_item_price_data(frm, cdt, cdn, row);

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

                    get_item_price_data(frm);

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
        get_item_price_data(frm, cdt, cdn, row);
        // update grand total
        calc_grand_total(frm);
    },
    items_add: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.gi_date = frm.doc.date;
    },
});

function calc_grand_total(frm) {
    var grand_total = 0;
    var total_qty = 0;
    $.each(frm.doc.items || [], function (i, item) {
        grand_total += item.amount;
        total_qty += item.qty;
    });
    frm.set_value("grand_total", grand_total);
    frm.set_value("total_qty", total_qty);
    refresh_field("grand_total");
    refresh_field("total_qty");
}

function get_item_price_data(frm, cdt, cdn, row) {
    // Fetch item price based on customer and item_code and set rate in row
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Item Price",
            filters: {
                item_code: row.item_code,
                price_list: frm.doc.price_list,
            },
            fields: [
                "price_list_rate",
                "custom_snc_commission_type",
                "custom_snc_commission_",
                "custom_snc_commission_lumpsum",
                "custom_rep_commission_type",
                "custom_rep_commission_",
                "custom_snc_commission_amount",
                "custom_rep_commission_amount",
                "custom_representative",
                "custom_has_representative_commission",
            ],
        },
        callback: function (r) {
            if (r.message) {
                frappe.model.set_value(
                    cdt,
                    cdn,
                    "rate",
                    r.message.price_list_rate
                );
                frappe.model.set_value(
                    cdt,
                    cdn,
                    "snc_commission_type",
                    r.message.custom_snc_commission_type
                );
                frappe.model.set_value(
                    cdt,
                    cdn,
                    "snc_commission_",
                    r.message.custom_snc_commission_
                );
                frappe.model.set_value(
                    cdt,
                    cdn,
                    "snc_commission_lumpsum",
                    r.message.custom_snc_commission_lumpsum
                );
                if (r.message.custom_snc_commission_lumpsum) {
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "snc_commission_amount",
                        r.message.custom_snc_commission_lumpsum * row.qty
                    );
                } else if (r.message.custom_snc_commission_) {
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "snc_commission_amount",
                        (r.message.custom_snc_commission_ *
                            row.qty *
                            row.rate) /
                            100
                    );
                }
                frappe.model.set_value(
                    cdt,
                    cdn,
                    "has_representative_commission",
                    r.message.custom_has_representative_commission
                );
                frappe.model.set_value(
                    cdt,
                    cdn,
                    "rep_commission_type",
                    r.message.custom_rep_commission_type
                );
                frappe.model.set_value(
                    cdt,
                    cdn,
                    "rep_commission_",
                    r.message.custom_rep_commission_
                );
                if (r.message.custom_rep_commission_) {
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "rep_commission_amount",
                        (r.message.custom_rep_commission_ *
                            row.qty *
                            row.rate) /
                            100
                    );
                } else if (r.message.custom_rep_commission_amount) {
                    frappe.model.set_value(
                        cdt,
                        cdn,
                        "rep_commission_amount",
                        r.message.custom_rep_commission_amount * row.qty
                    );
                }
            }
        },
    });
}
