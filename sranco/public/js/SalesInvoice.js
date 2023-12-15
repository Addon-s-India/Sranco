frappe.ui.form.on("Sales Invoice", {
    refresh: function (frm) {
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    onload: function (frm) {
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
});

frappe.ui.form.on("Sales Invoice Item", {
    qty: function (frm, cdt, cdn) {
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
        update_rep_commission(frm, cdt, cdn);
        update_snc_commission(frm, cdt, cdn);
    },
    custom_rep_commission_type: function (frm, cdt, cdn) {
        update_rep_commission(frm, cdt, cdn);
        calc_total_rep_commission(frm);
    },
    custom_snc_commission_type: function (frm, cdt, cdn) {
        update_snc_commission(frm, cdt, cdn);
        calc_total_snc_commission(frm);
    },
});

function calc_total_rep_commission(frm) {
    // calculate total representative commission and set it to custom_total_representative_commission field
    var total_rep_commission = 0;
    frm.doc.items.forEach(function (item) {
        total_rep_commission += item.custom_rep_commission_amount;
    });
    frm.set_value(
        "custom_total_representative_commission",
        total_rep_commission
    );
    frm.refresh_field("custom_total_representative_commission");
}

function calc_total_snc_commission(frm) {
    // calculate total snc commission and set it to custom_total_snc_commission field
    var total_snc_commission = 0;
    frm.doc.items.forEach(function (item) {
        total_snc_commission += item.custom_snc_commission_amount;
    });
    frm.set_value("custom_total_snc_commission", total_snc_commission);
    frm.refresh_field("custom_total_snc_commission");
}

function update_rep_commission(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.custom_rep_commission_type == "Percent") {
        row.custom_rep_commission_amount =
            (row.custom_rep_commission_ * row.rate * row.qty) / 100;
        frm.refresh_field("items");
    } else if (row.custom_rep_commission_type == "Amount") {
        row.custom_rep_commission_amount =
            row.custom_rep_commission_amount_per_qty * row.qty;
        frm.refresh_field("items");
    }
}

function update_snc_commission(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.custom_snc_commission_type == "Percent") {
        row.custom_snc_commission_amount =
            (row.custom_snc_commission_ * row.rate * row.qty) / 100;
        frm.refresh_field("items");
    } else if (row.custom_snc_commission_type == "Amount") {
        row.custom_snc_commission_amount =
            row.custom_snc_commission_amount_per_qty * row.qty;
        frm.refresh_field("items");
    }
}
