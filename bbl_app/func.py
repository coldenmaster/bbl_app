import frappe
# from wechat_work.utils import send_str_to_admin
# import wechat_work
import wechat_work.utils
from frappe import _
from frappe.utils import get_fullname

from bbl_api.utils import print_cyan, print_green, print_red


def get_home_page(user):
    # print_green(f"get_home_page user: {user} role: {frappe.get_roles()}")
    if (user == "Guest"):
        return "guest_me"
    
#  importlib.reload(wechat_work.utils)
def on_login(login_manager):
    if login_manager.user != "Guest":
        subject = _("{0} logged in").format(get_fullname(login_manager.user))
        # send_str_to_admin(subject)
        frappe.enqueue(wechat_work.utils.send_str_to_admin, msg = subject)

def on_session_creation(login_manager):
    if login_manager.user != "Guest":
        subject = _("{0} on_session_creation").format(get_fullname(login_manager.user))
        # send_str_to_admin(subject)
        frappe.enqueue(wechat_work.utils.send_str_to_admin, msg = subject)


def after_insert_all(doc, method=None):
    if isinstance(doc, str):
        doctype = doc  # assuming doctype name was passed directly
    else:
        doctype = doc.doctype
    print_cyan(f"after_insert_all for {doctype}, {method=}")
    user = get_fullname()
    if doctype == "Mold":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', msg = f'{user}:新建模具成功')
    if doctype == "Product Weight Record":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', msg = f'{user}:新建下料重量成功')
    if doctype == "Forge Process Record":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', msg = f'{user}:新建锻造生产记录成功')
    if doctype == "Product Weight Paint":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', now=True, msg = f'{user}:新建成品重量')
    # if doctype == "Paint Output":
    #     frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', msg = f'{user}:新建油漆产量')
    if doctype == "Purchase Receipt":
        print_cyan(f"查找采购收货单的submit {doctype}")

test_doc_type = "Steel Batch"

def before_insert_all(doc, method=None):
    if isinstance(doc, str):
        doctype = doc
    else:
        doctype = doc.doctype
    if doctype == test_doc_type:
        print_cyan(f"before_insert_all for {doctype}, {method=}")
        
def doc_event_hook(doc, method=None):
    if isinstance(doc, str):
        doctype = doc
    else:
        doctype = doc.doctype
    if frappe.conf.wt_dev:
        print_cyan(f"doc_event_hook for {doctype}, {method=}")

@frappe.whitelist(allow_guest=True)
def ping():
    # your custom implementation of the standard get_count method provided by frappe
    # The method should have the same signature as the original method.
    frappe.ping()
    return "wt pong"

def get_config():
    return {
        "for_doctype": {
            "Issue": {"status":"Open"},
            "Issue": {"status":"Open"},
        },
        "for_module_doctypes": {
            "ToDo": "To Do",
            "Event": "Calendar",
            "Comment": "Messages"
        },
        "for_module": {
            "To Do": "frappe.core.notifications.get_things_todo",
            "Calendar": "frappe.core.notifications.get_todays_events",
            "Messages": "frappe.core.notifications.get_unread_messages"
        }
    }

def get_permission_query_conditions_sb(user):
	# if not user:
	# 	user = frappe.session.user
	# return f"""(`tabEvent`.`event_type`='Public' or `tabEvent`.`owner`={frappe.db.escape(user)})"""
    pass


def on_submit_purchase_receipt(doc, method=None):
    # print_red(f"hook def on_submit_purchase_receipt { doc= }, { method= }")
    pass
    
def after_insert_purchase_receipt(doc, method=None):
    # print_red(f"hook def after_insert_purchase_receipt { doc= }, { method= }")
    pass

def after_insert_stock_entry(doc, method=None):
    # print_cyan(f"hook after_insert_stock_entry { doc= }, { method= }")
    pass
