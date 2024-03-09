app_name = "bbl_app"
app_title = "Bbl App"
app_publisher = "bbl"
app_description = "bbl app costom in here"
app_email = "wangtao@hbbbl.top"
app_license = "mit"
# required_apps = []

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/bbl_app/css/bbl_app.css"
# app_include_js = "/assets/bbl_app/js/bbl_app.js"
app_include_js = "/assets/bbl_app/js/map_defaults.js"

# include js, css files in header of web template
# web_include_css = "/assets/bbl_app/css/bbl_app.css"
# web_include_js = "/assets/bbl_app/js/bbl_app.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "bbl_app/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "bbl_app/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# 不能使用，不能拿到最大权限的角色
# website user home page (by Role) 
# role_home_page = {
# 	"Guest": "guest_index"
# }

get_website_user_home_page = "bbl_app.func.get_home_page"

standard_portal_menu_items = [
    {"title": "Dash 2", "route": "/dashboard", "role": ""},
    {"title": "Order 3", "route": "/orders", "role": "Customer"},
    {"title": "填写温度", "route": "/rcl-temp/new", "role": ""},
]


on_login = "bbl_app.func.on_login"

doc_events = {
    "*": {
        "after_insert": "bbl_app.func.after_insert_all",
    }
}

# 通过以下命令导出数据库数据进行迁移
# bench export-fixtures --app bbl_app
fixtures = [
    # "Device Type",
    # "Iot Device",
    # "Report Period"
    # "Product Weight Paint",
    # "Customer",
    # "Product Name",
    # "Employee",
    # "Workshop",
    # "Operation Tree",
    # "Department",
    # "Employee Grade",
    # "Designation",
    # "Semi Product", # 使用以后关掉，保证再次migrate不生成
    # {
    #     "doctype": "Semi Product",
    #     "filters": [ [ "name", "!=", "" ] ],
    # },

]

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
#	"methods": "bbl_app.utils.jinja_methods",
#	"filters": "bbl_app.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "bbl_app.install.before_install"
# after_install = "bbl_app.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "bbl_app.uninstall.before_uninstall"
# after_uninstall = "bbl_app.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "bbl_app.utils.before_app_install"
# after_app_install = "bbl_app.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "bbl_app.utils.before_app_uninstall"
# after_app_uninstall = "bbl_app.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "bbl_app.notifications.get_notification_config"

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
#	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

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
#		"bbl_app.tasks.all"
#	],
#	"daily": [
#		"bbl_app.tasks.daily"
#	],
#	"hourly": [
#		"bbl_app.tasks.hourly"
#	],
#	"weekly": [
#		"bbl_app.tasks.weekly"
#	],
#	"monthly": [
#		"bbl_app.tasks.monthly"
#	],
# }

# Testing
# -------

# before_tests = "bbl_app.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
#	"frappe.desk.doctype.event.event.get_events": "bbl_app.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
#	"Task": "bbl_app.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["bbl_app.utils.before_request"]
# after_request = ["bbl_app.utils.after_request"]

# Job Events
# ----------
# before_job = ["bbl_app.utils.before_job"]
# after_job = ["bbl_app.utils.after_job"]

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
#	"bbl_app.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
#	"Logging DocType Name": 30  # days to retain logs
# }

