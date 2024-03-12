import frappe
from datetime import datetime
from sranco.sranco.doctype.stock_order.stock_order import StockOrder

class StockOrderCustom(StockOrder):
        
    def formatted_creation_time(self):
        # Ensure creation is a datetime object and format it
        if isinstance(self.creation, datetime):
            return self.creation.strftime('%d-%m-%Y')
        else:
            # Attempt to parse the creation string into a datetime object
            try:
                # Adjust the parsing format to match the expected input format of self.creation
                # This is just an example format, you might need to adjust it to match your actual input
                creation_obj = datetime.strptime(str(self.creation), '%Y-%m-%d %H:%M:%S.%f')
                return creation_obj.strftime('%d-%m-%Y')
            except ValueError:
                # Handle the case where creation is not in the expected format
                return 'Invalid date format'