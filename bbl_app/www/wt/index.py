
import bbl_app.www.wt.sb
import frappe

import importlib

from bbl_api.utils import print_blue, print_red


def get_context(context):
    print_red('index.html get_context()')
    context.index = 'Welcome to the index page'.split()
    context.users = frappe.get_list("User", fields=["first_name", "last_name"])
    context.testpy = 'test-112'
