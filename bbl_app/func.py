import frappe
from bbl_api.utils import print_green, print_red
from wechat_work.utils import send_str_to_admin

from frappe import _
from frappe.utils import get_fullname


def get_home_page(user):
    # print_green(f"get_home_page user: {user} role: {frappe.get_roles()}")
    if (user == "Guest"):
        return "guest_me"
    
    
def on_login(login_manager):
    if login_manager.user != "Guest":
        subject = _("{0} logged in").format(get_fullname(login_manager.user))
        # send_str_to_admin(subject)
        frappe.enqueue("send_str_to_admin", arg1 = subject)


def after_insert_all(doc, method=None):
	if isinstance(doc, str):
		doctype = doc  # assuming doctype name was passed directly
	else:
		doctype = doc.doctype

	if doctype == "Mold":
		print_red(f"after_insert_all {doctype}")