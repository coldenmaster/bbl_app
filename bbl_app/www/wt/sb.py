import importlib
import frappe

import bbl_app.www.wt.sb
# import bbl_app.www.wt.index
# import bbl_app.www.wt.reload

from bbl_api.utils import print_blue, print_red

print_red("sb.py 加载一次 2")

def get_context(context):
    p1()
    context.index = 'Welcome to the index page'.split()
    context.users = frappe.get_list("User", fields=["first_name", "last_name"])

    context.testpy = 'test-56'
    print_blue(f'{context.testpy =}')
    p2()


def import_lib():
    re = importlib.reload(bbl_app.www.wt.sb)
    re = importlib.reload(bbl_app.www.wt.reload)
    
    print_blue("重新加载 bbl_app.www.wt.sb")
    print_blue(re)

def p1():
    print_red('1234')
    import_lib()
    
def p2():
    print_red('p2 我是重点测试内容, m')