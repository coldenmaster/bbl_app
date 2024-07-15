from erpnext.stock.doctype.purchase_receipt.purchase_receipt import PurchaseReceipt
import frappe
from frappe import _
from frappe.desk.doctype.todo.todo import ToDo
from bbl_api.utils import  print_blue, print_green
# from bbl_api.wt_test.t1 import T1_BOS


class CustomToDo(ToDo):
    # print_green('自定义 ToDo 加载')
    # def __init__(self, *args, **kwargs):
    #     # super().__init__()
    #     print_green('自定义 ToDo 初始化完成。')

    def on_update(self):
        self.my_custom_code()
        super().on_update()

    def my_custom_code(self):
        print_green('CustomToDo: in on_update(), Custom code is running')
        pass

    def pr(self):
        print('dsb')



class CustomPurchaseReceipt(PurchaseReceipt):
    def on_submit(self):
        self.process_steel_batch()
        super().on_submit()


    def process_steel_batch(self):
        """ 处理过程：
        2. 获取单据的items子表
        1. 检查是否为原材料类物料
        3. 获取SABB 解析初batch_no
        4. 获取steel.doc
        5. 更改状态为已入库，更改在库重量，根数，
        """
        print_blue("pr, backend process, steel batch")
        item_docs = self.get("items")
        if not len(item_docs):
            return
        # print_blue(f'{item_docs=}')
        try:
            for item_doc in item_docs:
                # if not item_doc.serial_and_batch_bundle:
                #     continue
                # if not item_doc.serial_and_batch_bundle.startswith("YGRK"):
                #     continue
                if item_doc.serial_and_batch_bundle and item_doc.serial_and_batch_bundle.startswith("YGRK"):
                    # 获取SABB 解析出batch_nos
                    sabb_doc = frappe.get_doc("Serial and Batch Bundle", item_doc.serial_and_batch_bundle)
                    # print_blue(f'{vars(sabb_doc)=}')
                    batchs = sabb_doc.entries
                    op_length = 0
                    op_piece = 0
                    op_heat_no = ""
                    for batch in batchs:
                        # print_blue(f'{vars(batch)=}')
                        sb_doc = frappe.get_doc("Steel Batch", batch.batch_no)
                        op_length = op_length or sb_doc.length 
                        op_piece += sb_doc.remaining_piece
                        op_heat_no = op_heat_no or sb_doc.heat_no

                        """ 对每一批次记录Op Flow/批次, 然后记录合计 """
                        # frappe.get_doc({
                        #     "doctype": "Raw Op Flow",
                        #     "record_type": "批次",
                        #     "op_type": "原材料入库",
                        #     "batch_doc": "Steel Batch",
                        #     "batch_no": batch.batch_no,
                        #     "link_doc_type": "Purchase Receipt",
                        #     "link_doc": self.name,
                        #     "item_name": sb_doc.raw_name,
                        #     "heat_no": sb_doc.heat_no,
                        #     "length": sb_doc.length,
                        #     "piece": sb_doc.remaining_piece,
                        #     "weight": sb_doc.weight,
                        # }).save()

                        sb_doc.update({
                            'link_doc_in': self.name,
                            "status": "已入库",
                        }).save()

                    # 批次合计,根据原材料的名称进行合计
                    frappe.get_doc({
                        "doctype": "Raw Op Flow",
                        "record_type": "批次合计",
                        "op_type": "原材料入库",
                        "batch_doc": "Steel Batch",
                        # "batch_no": batch.batch_no, # 或者可以记录全部包含的批次号
                        "link_doc_type": "Purchase Receipt",
                        "link_doc": self.name,
                        "item_name": item_doc.item_code,
                        "heat_no": op_heat_no,
                        "length": op_length, # 只记录第一个批次的长度
                        "piece": op_piece,
                        "weight": item_doc.qty,
                    }).save()
                    

            # frappe.db.commit()
        except Exception as e:
            print("process steel batch error", e)
            frappe.throw(f"原材料采购入库,调整sb记录失败：{e}")


