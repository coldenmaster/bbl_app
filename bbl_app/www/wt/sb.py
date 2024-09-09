import importlib
from pprint import pformat
import frappe

import bbl_app.www.wt.sb
# import bbl_app.www.wt.index
import bbl_app.www.wt.reload

from bbl_api.utils import _print_blue_pp, _print_green_pp, print_blue, print_purple, print_red

print_red("sb.py 加载一次 2")

def get_context(context):
    print_purple(f'{frappe.session.user =}')
    p1()
    p_ctx(context)
    context.index = 'Welcome to the index page'.split()
    context.users = frappe.get_list("User", fields=["first_name", "last_name"])

    context.testpy = frappe.utils.random_string(5)
    print(f'{context.testpy=}')
    p2()
    p3()


def import_lib():
    re = importlib.reload(bbl_app.www.wt.sb)
    re = importlib.reload(bbl_app.www.wt.reload)
    
    print(f"重新加载:\n{re=}")

def p1():
    print_red('import_lib()')
    import_lib()
    
def p_ctx(context):
    print_purple("get_context(), context:")
    # _print_blue_pp(context)
    _print_blue_pp(frappe.local.request)
    # raise Exception("test exception")
    # frappe.throw("test shutdown")


def p2():
    print_red('p2 我是重点测试内容')

def p3():
    print_red('p3:')
    print(f'frappe.session', type(frappe.session))
    _print_green_pp(frappe.session)
    # raise Exception("sb p3 raise exception")
    # with open("vars_frappe.txt", "w") as f:
    #     print( str(pformat(vars(frappe))), file=f)
    # _print_green_pp(frappe.boot.get_bootinfo()) # very long 应该在前端查看
    _print_blue_pp(vars(frappe.local.request))
    _print_green_pp((frappe.local.http_request))
    _print_green_pp(vars(frappe.local.http_request))
    _print_blue_pp(frappe.local.request_ip)


