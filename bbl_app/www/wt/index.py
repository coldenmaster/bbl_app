
import frappe

from bbl_api.utils import print_blue, print_red


def get_context(context):
    context.index = 'Welcome to the index page'.split()
    context.users = frappe.get_list("User", fields=["first_name", "last_name"])
    # print_red(context.users)
    print_blue("context.users")
    print_red(context.index)