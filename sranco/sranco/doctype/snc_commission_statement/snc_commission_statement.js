// Copyright (c) 2023, Dinesh Panchal and contributors
// For license information, please see license.txt

frappe.ui.form.on("SNC Commission Statement", {
    refresh: function (frm) {
        frm.get_field("statement").grid.cannot_add_rows = true;
    },
    onload: function (frm) {
        frm.get_field("statement").grid.cannot_add_rows = true;
    },
    from: function (frm) {
        console.log("from");
        get_sales_invoice_data(frm);
    },
    to: function (frm) {
        console.log("to");
        get_sales_invoice_data(frm);
    },
});

frappe.ui.form.on("SNC Commission Statement Table", {
    statement_remove: function (frm, cdt, cdn) {
        calc_totals(frm);
    },
});

function get_sales_invoice_data(frm) {
    if (frm.doc.from && frm.doc.to) {
        console.log("get_sales_invoice_data");
        frappe.call({
            method: "sranco.sales_invoice.get_snc_sales_invoice_list",
            args: {
                from_date: frm.doc.from,
                to_date: frm.doc.to,
            },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    // set the list to statement child table fields representative, sales_invoice, invoice_date, commission_amount, customer in each row
                    frm.doc.statement = [];
                    $.each(r.message, function (i, d) {
                        var c = frm.add_child("statement");
                        c.sales_invoice = d.sales_invoice;
                        c.invoice_date = d.invoice_date;
                        c.commission_amount = d.commission_amount;
                        c.customer = d.customer;
                        c.invoice_no_t = d.invoice_no_t;
                    });
                    frm.refresh_field("statement");
                    // calculate total commission amount from statement and set to total_commission and calculate total number of rows in statement and set to tatal_no_of_sales_invoices
                    calc_totals(frm);
                }
            },
        });
    }
}

function calc_totals(frm) {
    var total_commission = 0;
    var total_no_of_sales_invoices = 0;
    $.each(frm.doc.statement, function (i, d) {
        total_commission += d.commission_amount;
        total_no_of_sales_invoices += 1;
    });
    frm.set_value("total_commission", total_commission);
    frm.set_value("total_no_of_sales_invoice", total_no_of_sales_invoices);
    frm.refresh_field("total_commission");
    frm.refresh_field("total_no_of_sales_invoice");
}
