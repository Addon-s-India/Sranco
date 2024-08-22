import frappe

def quotation_on_submit(doc, method):
    for item in doc.items:
        # Fetch the related item document
        item_doc = frappe.get_doc("Item", item.item_code)
        
        # Update custom fields in the Item doctype
        item_doc.custom_tn_number = item.custom_tn_number
        item_doc.custom_shape = item.custom_shape
        item_doc.custom_diameter = item.custom_diameter
        item_doc.custom_thickness = item.custom_thickness
        item_doc.custom_bore = item.custom_bore
        item_doc.custom_speed = item.custom_speed
        item_doc.custom_specification = item.custom_specification
        item_doc.custom_more_dimensions = item.custom_more_dimensions
        item_doc.custom_application = item.custom_application
        
        # Save the updated item document
        item_doc.save()

        frappe.msgprint(f"Updated item parameters for {item.item_code}", alert=True)

