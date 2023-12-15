frappe.ui.form.on("Sales Partner", {
    onload: function (frm) {
        // set commision value to 0
        frm.set_value("commission_rate", 0);
        frm.set_value("partner_type", "Agent");
        frm.set_value("territory", "India");
    },
    after_save: function (frm) {
        console.log("on save");
        if (
            frm.doc.partner_name.length > 0 &&
            frm.doc.custom_supplier.length == 0
        ) {
            console.log("partner name exists");
            // create new supplier for the partner
            frappe.call({
                method: "sranco.api.create_new_supplier",
                args: {
                    partner_name: frm.doc.partner_name,
                },
                callback: function (response) {
                    console.log(
                        "response from new supplier:: ",
                        response.message
                    );
                },
            });
        }
    },
    partner_name: function (frm) {
        // try and find if partner name already exists in supplier
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Supplier",
                filters: {
                    supplier_name: frm.doc.partner_name,
                },
            },
            callback: function (response) {
                console.log("response from supplier:: ", response.message);
                if (response.message.length > 0) {
                    // if supplier exists, set the supplier name
                    frm.set_value("custom_supplier", response.message[0].name);
                } else {
                    frm.set_value("custom_supplier", "");
                }
            },
        });
    },
});
