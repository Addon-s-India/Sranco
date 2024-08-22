from . import __version__ as app_version

app_name = "sranco"
app_title = "Sranco"
app_publisher = "Dinesh Panchal"
app_description = "customizations"
app_email = "dinesh@addon-s.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "public/css/report.css"
# app_include_js = "/assets/sranco/js/sranco.js"
fixtures = [
    {"dt": "Print Format", "filters": [
        [
            "module", "like", 
                "Sranco"
            
        ]
    ]}
]
# include js, css files in header of web template
# web_include_css = "/assets/sranco/css/sranco.css"
# web_include_js = "/assets/sranco/js/sranco.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "sranco/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Opportunity": "public/js/Opportunity.js",
    "Sales Invoice": "public/js/SalesInvoice.js",
    "Quotation": "public/js/Quotation.js",
    "Sales Order": "public/js/SalesOrder.js",
    "Item Price": "public/js/ItemPrice.js",
    "Purchase Receipt": "public/js/PurchaseReceipt.js",
    "Sales Partner": "public/js/SalesPartner.js",
}
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
#	"methods": "sranco.utils.jinja_methods",
#	"filters": "sranco.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "sranco.install.before_install"
# after_install = "sranco.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "sranco.uninstall.before_uninstall"
# after_uninstall = "sranco.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "sranco.utils.before_app_install"
# after_app_install = "sranco.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "sranco.utils.before_app_uninstall"
# after_app_uninstall = "sranco.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "sranco.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
#	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
#	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"Stock Order": "sranco.utils.jinja_methods.StockOrderCustom",
# }
# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
    "Sales Order": {
        "on_submit": "sranco.sales_order.on_submit",
    },
    "Stock Order": {
        "on_submit": "sranco.stock_order.on_submit",
    },
    "Item Price": {
        "validate": "sranco.item_price.validate"
    },
    "Purchase Receipt": {
        "on_trash": "sranco.purchase_receipt.reset_received_qty_in_shipment_tracker",
    },
    "Quotation": {
        "on_submit": "sranco.quotation.quotation_on_submit",
    },
}

# doc_events = {
#	"*": {
#		"on_update": "method",
#		"on_cancel": "method",
#		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
#	"all": [
#		"sranco.tasks.all"
#	],
#	"daily": [
#		"sranco.tasks.daily"
#	],
#	"hourly": [
#		"sranco.tasks.hourly"
#	],
#	"weekly": [
#		"sranco.tasks.weekly"
#	],
#	"monthly": [
#		"sranco.tasks.monthly"
#	],
# }

# Testing
# -------

# before_tests = "sranco.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
#	"frappe.desk.doctype.event.event.get_events": "sranco.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
#	"Task": "sranco.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["sranco.utils.before_request"]
# after_request = ["sranco.utils.after_request"]

# Job Events
# ----------
# before_job = ["sranco.utils.before_job"]
# after_job = ["sranco.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
#	{
#		"doctype": "{doctype_1}",
#		"filter_by": "{filter_by}",
#		"redact_fields": ["{field_1}", "{field_2}"],
#		"partial": 1,
#	},
#	{
#		"doctype": "{doctype_2}",
#		"filter_by": "{filter_by}",
#		"partial": 1,
#	},
#	{
#		"doctype": "{doctype_3}",
#		"strict": False,
#	},
#	{
#		"doctype": "{doctype_4}"
#	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
#	"sranco.auth.validate"
# ]
