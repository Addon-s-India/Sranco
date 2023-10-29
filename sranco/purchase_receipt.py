import frappe

def reset_received_qty_in_shipment_tracker(doc, method):
    for item in doc.items:
        if item.custom_shipment_tracker and item.custom_selected_transport_mode:
            shipment = frappe.get_doc("Shipment Tracker", item.custom_shipment_tracker)
            for mode_row in shipment.transport_mode_table:
                if mode_row.mode == item.custom_selected_transport_mode:
                    mode_row.received_qty = 0
                    shipment.save()
                    break
