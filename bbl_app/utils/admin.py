
# 其它工具

import frappe
from frappe.utils.data import DATE_FORMAT, now_datetime

from bbl_api.utils import print_red


_TIME_FORMAT = "%H:%M:%S"
def bbl_now() -> str:
    return now_datetime().strftime(DATE_FORMAT + _TIME_FORMAT)

# frappe.utils 内已经有了(first_name + last_name), 我这个是直接取full_name
def get_fullname(user_id:str = None):
    if not user_id:
        user_id = frappe.session.user
    return frappe.db.get_value('User', user_id, ['full_name'])

# todo 清除数据库中数据，进行干净清楚的测试
def clear_db_for_dev():
    print_red('clear_db_for_dev from <erp.v16> == ' + frappe.local.site)
    frappe.only_for("System Manager")
    if frappe.local.site != 'erp.v16':
        return

    try:
        # todo <<注意不要删除需要的了>> <<直接删除，非常危险>>
        frappe.db.delete("Steel Batch")
        frappe.db.delete("Short Raw Bar")
        frappe.db.delete("Heat No")
        frappe.db.delete("Batch")
        frappe.db.delete("Serial and Batch Bundle")
        frappe.db.delete("Serial and Batch Entry")
        frappe.db.delete("Purchase Receipt")
        frappe.db.delete("Purchase Receipt Item")
        # 注意 手动删除数据库记录时，母表都要检查所带的子表，一并删除
        frappe.db.delete("Stock Entry")
        frappe.db.delete("Stock Entry Detail") # 删除不掉物料，因为此数据没有删除 
        frappe.db.delete("Stock Ledger Entry")
        frappe.db.delete("Item", {"item_group": ["in", ["原材料", "短棒料", "长料头", "锻坯",]]})
        # frappe.db.delete("Item", {"item_group": ["in", ["锻坯",]]})
        frappe.db.delete("UOM Conversion Detail")
        frappe.db.delete("Item Default")
        frappe.db.delete("Raw Op Flow")
        frappe.db.delete("Semi Op Flow")
        frappe.db.delete("Temp Doc Value")
        frappe.db.delete("BOM")
        frappe.db.delete("BOM Item")
        frappe.db.delete("BOM Explosion Item")
        frappe.db.delete("Work Order")
        frappe.db.delete("Semi Product Manage")

        # frappe.db.delete("Batch")
        # frappe.db.delete("Batch")
        # frappe.db.delete("GL Entry") # 总账条目
        # frappe.db.delete("Batch")
        # frappe.db.delete("Batch")
        pass
    except Exception:   
        frappe.db.rollback()
        frappe.log_error("Failed to clear_db")
        frappe.throw(
            ("Failed to clear_db data"),
            title=("Could Not clear test db Data"),
        )
    frappe.db.commit()


def create_doc_for_server():

    # doc1 = frappe.get_doc( "Item Group", "短棒料")
    # doc1.name = None
    # doc1.item_group_name = "锻坯2"
    # doc1.parent_item_group = "半成品"
    # print_red(doc1)
    # doc1.insert()

    doc1 = frappe.get_doc("Item Group", "锻坯")
    # create_new_group(doc1, "打磨品")
    # create_new_group(doc1, "探伤品")
    # create_new_group(doc1, "调质品")
    # create_new_group(doc1, "正火品")
    # create_new_group(doc1, "抛丸品")
    # create_new_group(doc1, "冷校正品")
    create_new_group(doc1, "过程半成品")

    doc2 = frappe.get_doc("Account", "锻造车间科目 - 百兰")
    print_red(f'{doc2=}')
    create_new_account(doc2, "打磨车间科目")
    create_new_account(doc2, "热处理车间科目")
    create_new_account(doc2, "抛丸车间科目")

    doc3 = frappe.get_doc("Warehouse", "锻造车间仓库 - 百兰")
    create_new_warehouse(doc3, "打磨车间")
    create_new_warehouse(doc3, "热处理车间")
    create_new_warehouse(doc3, "抛丸车间")

    frappe.db.commit()



def create_new_group(doc, group_name):
    doc.item_group_name = group_name
    doc.name = None
    try:
        doc.insert()
    except Exception:
        pass

def create_new_account(doc, name):
    doc.account_name = name
    doc.name = None
    try:
        doc.insert()
    except Exception:
        pass

def create_new_warehouse(doc, name):
    warehouse = name + "仓库"
    account = name + "科目 - 百兰"
    doc.warehouse_name = warehouse
    doc.account = account
    doc.name = None
    try:
        doc.insert()
    except Exception:
        pass

def t1():
    # user_list = frappe.get_all("User", filters={"enabled": 1}, fields=["name"])
    user_list = frappe.get_all("User",
                                   filters={
                                       "enabled": 1,
                                       "user_type": "System User"
                                    },
                                pluck='name')
    print_red(user_list)





""" 控制台测试方法
import bbl_app.utils.admin as admin
sb.make_out_entry(**sb.k3)
docs = frappe.get_all("Steel Batch")
"""