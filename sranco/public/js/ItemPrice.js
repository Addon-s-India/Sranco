frappe.ui.form.on("Item Price", {
    onload: function (frm) {
        frm.get_field("custom_price_history").grid.cannot_add_rows = true;
        frm.get_field("custom_price_history").grid.cannot_delete_rows = true;
        frm.fields_dict["custom_price_history"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();

        frm.get_field(
            "custom_snc_commission_history"
        ).grid.cannot_add_rows = true;
        frm.get_field(
            "custom_snc_commission_history"
        ).grid.cannot_delete_rows = true;
        frm.fields_dict["custom_snc_commission_history"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();

        frm.get_field(
            "custom_representative_commission_history"
        ).grid.cannot_add_rows = true;
        frm.get_field(
            "custom_representative_commission_history"
        ).grid.cannot_delete_rows = true;
        frm.fields_dict["custom_representative_commission_history"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();
    },
    refresh: function (frm) {
        frm.get_field("custom_price_history").grid.cannot_add_rows = true;
        frm.get_field("custom_price_history").grid.cannot_delete_rows = true;
        frm.fields_dict["custom_price_history"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();

        frm.get_field(
            "custom_snc_commission_history"
        ).grid.cannot_add_rows = true;
        frm.get_field(
            "custom_snc_commission_history"
        ).grid.cannot_delete_rows = true;
        frm.fields_dict["custom_snc_commission_history"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();

        frm.get_field(
            "custom_representative_commission_history"
        ).grid.cannot_add_rows = true;
        frm.get_field(
            "custom_representative_commission_history"
        ).grid.cannot_delete_rows = true;
        frm.fields_dict["custom_representative_commission_history"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();
    },
    custom_snc_commission_: function (frm) {
        // calculate the percent of price_list_rate and set it to custom_snc_commission_amount
        const commission_amount =
            (frm.doc.custom_snc_commission_ * frm.doc.price_list_rate) / 100;
        console.log("commission_amount", commission_amount);
        frm.set_value("custom_snc_commission_amount", commission_amount);
    },
    custom_snc_commission_lumpsum: function (frm) {
        // calculate the percent of price_list_rate and set it to custom_snc_commission_amount
        frm.set_value(
            "custom_snc_commission_amount",
            frm.doc.custom_snc_commission_lumpsum
        );
    },
    custom_rep_commission_: function (frm) {
        // calculate the percent of price_list_rate and set it to custom_rep_commission_amount
        const commission_amount =
            (frm.doc.custom_rep_commission_ * frm.doc.price_list_rate) / 100;
        console.log("commission_amount", commission_amount);
        frm.set_value("custom_rep_commission_amount", commission_amount);
    },
});
