import frappe
# from wechat_work.utils import send_str_to_admin
# import wechat_work
import wechat_work.utils
from frappe import _
from frappe.utils import get_fullname


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


def after_insert_all(doc, method=None):
    if isinstance(doc, str):
        doctype = doc  # assuming doctype name was passed directly
    else:
        doctype = doc.doctype
    user = get_fullname()
    if doctype == "Mold":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', msg = f'{user}:新建模具成功')
        print(f"after_insert_all {doctype}")
    if doctype == "Product Weight Record":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', msg = f'{user}:新建下料重量成功')
    if doctype == "Forge Process Record":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', msg = f'{user}:新建锻造生产记录成功')
    if doctype == "Paint Output":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', msg = f'{user}:新建油漆产量')
    if doctype == "Product Weight Paint":
        frappe.enqueue(wechat_work.utils.send_str_to_admin, queue='short', now=True, msg = f'{user}:新建成品重量')