import datetime
from erpnext.stock.doctype.stock_entry.stock_entry import StockEntry
import frappe
from frappe import _, _dict
from frappe.desk.doctype.todo.todo import ToDo
from frappe.utils.data import cint, comma_or, flt, now
from bbl_api.utils import _print_blue_pp, _print_green_pp, print_blue, print_cyan, print_green, print_green_pp, print_red
from bbl_api.wt_test.t1 import T1_BOS


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


# frappe.cache.set_value('cache_wt_test', True)

class CustomStockEntry(StockEntry):
    # print_green('自定义 StockEntry 加载 1')
    def on_submit(self):
        print_green('CustomStockEntry: on_submit 运行自定义代码->')
        # print('on_submit 传参 self 1  is:\n', self.as_dict())
        # print('on_submit 传参 self 2  is:\n', self.items)
        # print('on_submit 传参 self 3  is:\n', self.items[0].as_dict)
        if self.stock_entry_type == '原材料下料出库':
            process_steel_batch(self)
            create_raw_bar(self)
        super().on_submit()

    def on_update(self):
        super().on_update()
            
    def on_cancel(self):
        super().on_cancel()
    
    def on_trash(self):
        print_red("se on_trash()")
        if self.stock_entry_type == '原材料下料出库':
            restore_steel_batch_status(self)
        return super().on_trash()
        


    def validate_purpose(self):
        valid_purposes = [
            "Material Issue",
            "Material Receipt",
            "Material Transfer",
            "Material Transfer for Manufacture",
            "Manufacture",
            "Repack",
            "Send to Subcontractor",
            "Material Consumption for Manufacture",
            "Bbl Not Op"
        ]

        if self.purpose not in valid_purposes:
            frappe.throw("wt_over:" + _("Purpose must be one of {0}").format(comma_or(valid_purposes)))

        if self.job_card and self.purpose not in ["Material Transfer for Manufacture", "Repack"]:
            frappe.throw(
                _(
                    "For job card {0}, you can only make the 'Material Transfer for Manufacture' type stock entry"
                ).format(self.job_card)
            )

se_doc = {'name': 'MAT-STE-2024-00189', 'owner': 'Administrator', 'creation': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified_by': 'Administrator', 'docstatus': 0, 'idx': 0, 'naming_series': 'MAT-STE-.YYYY.-', 'stock_entry_type': '原材料下料出库', 'outgoing_stock_entry': None, 'purpose': 'Bbl Not Op', 'add_to_transit': 0, 'work_order': None, 'purchase_order': None, 'subcontracting_order': None, 'delivery_note_no': None, 'sales_invoice_no': None, 'pick_list': None, 'purchase_receipt_no': None, 'company': '百兰车轴', 'posting_date': datetime.date(2024, 6, 17), 'posting_time': datetime.timedelta(seconds=58522, microseconds=524936), 'set_posting_time': 0, 'inspection_required': 0, 'apply_putaway_rule': 0, 'from_bom': 0, 'use_multi_level_bom': 1, 'bom_no': None, 'fg_completed_qty': 0.0, 'process_loss_percentage': 0.0, 'process_loss_qty': 0.0, 'from_warehouse': None, 'source_warehouse_address': None, 'source_address_display': None, 'to_warehouse': None, 'target_warehouse_address': None, 'target_address_display': None, 'scan_barcode': None, 'total_outgoing_value': 2720.0, 'total_incoming_value': 2720.0, 'value_difference': 0.0, 'total_additional_costs': 0.0, 'supplier': '大冶特钢', 'supplier_name': None, 'supplier_address': None, 'address_display': None, 'project': None, 'select_print_heading': None, 'letter_head': None, 'is_opening': 'No', 'remarks': None, 'per_transferred': 0.0, 'total_amount': 5440.0, 'job_card': None, 'amended_from': None, 'credit_note': None, 'is_return': 0, 'doctype': 'Stock Entry', 'additional_costs': [], 'items': [{'name': 'upg7dlocrt', 'owner': 'Administrator', 'creation': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified_by': 'Administrator', 'docstatus': 0, 'idx': 1, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': '原钢堆场 - 百兰', 't_warehouse': None, 'item_code': '40CrH-145', 'item_name': '40CrH-145', 'is_finished_item': 0, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': '40CrH-145', 'item_group': '原材料', 'image': None, 'qty': 2720.0, 'transfer_qty': 2720.0, 'retain_sample': 0, 'uom': 'Kg', 'stock_uom': 'Kg', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 1.0, 'additional_cost': 0.0, 'valuation_rate': 1.0, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 2720.0, 'amount': 2720.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00000580', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 0.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00189', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}, {'name': 'upg736e7tj', 'owner': 'Administrator', 'creation': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified_by': 'Administrator', 'docstatus': 0, 'idx': 2, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': None, 't_warehouse': '短棒料仓 - 百兰', 'item_code': '30BC_短棒料', 'item_name': '30BC_短棒料', 'is_finished_item': 1, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': '30BC_短棒料', 'item_group': '短棒料', 'image': None, 'qty': 24.0, 'transfer_qty': 24.0, 'retain_sample': 0, 'uom': '根', 'stock_uom': '根', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 113.333333333, 'additional_cost': 0.0, 'valuation_rate': 113.333333333, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 2720.0, 'amount': 2720.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00000581', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 0.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00189', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}]}



def restore_steel_batch_status(kw):
    """ 
    1.查询是否为‘原材料下料出库’，
    2.查询批次号进行status恢复为 已入库 半出库
    """
    # print_green('restore_steel_batch_status run')
    # kw = _dict(kw)
    print(f'{type(kw) = }')
    if not kw:
        kw = se_doc
    # todo 这里需要获取doc，进行校验后设状态
    # 1.是草稿状态 + 剩余==全部/已入库 or 剩余!= 0 + 剩余<= 全部 /半出库
    items = kw.get("items")
    batch_nos = set()
    for item in items:
        # item = _dict(item)
        if item.get("item_group") == '原材料':
            sabb_no = item.get("serial_and_batch_bundle")
            # 获取批次号
            batch_no_items = frappe.db.get_values("Serial and Batch Entry",
                                                { "parent": sabb_no, },
                                                "batch_no")
            for b in batch_no_items:
                batch_nos.add(b[0])
    sb_docs = frappe.get_list("Steel Batch", 
                    fields = '*',
                    filters = {"batch_no": ("in", batch_nos)},
                    )
    for sb in sb_docs:
        if sb.status == '草稿':
            if sb.remaining_weight == sb.weight:
                frappe.db.set_value("Steel Batch", sb.name, "status", "已入库")
            elif sb.remaining_weight < sb.weight:
                frappe.db.set_value("steel Batch", sb.name, "status", "半入库")
    #         sb.save()
    frappe.db.commit()




def process_steel_batch(self):
    """ 原材料下料出库，提交时steel batch的处理：
    1. 检查是否为原材料类物料
    3. 获取SABB 解析初batch_no
    4. 获取steel.doc
    5. 更改状态为已出库，或者半出库，更改在库重量，根数，
    """
    print_blue("stock entry, backend process, steel batch")
    # if self.stock_entry_type != '原钢调拨出库':
    #     return
    item_docs = self.get("items")
    # print_red(f'{len(item_docs)=}')
    try:
        for item_doc in item_docs:
            if item_doc.item_group != '原材料':
                continue
            print_blue(f'{item_doc.as_dict()=}')
            if not item_doc.serial_and_batch_bundle:
                continue
            # 获取批次号组，获取批次号，获取钢材捆批次进行改写
            sabb_no = item_doc.serial_and_batch_bundle
            sabb_doc = frappe.get_doc("Serial and Batch Bundle", sabb_no)
            # print_cyan(f'{sabb_doc.as_dict()=}')
            # 从SABB中找到 Steel Batch_No/weight, 
            for entry in sabb_doc.entries:
                print_cyan(f'batch_no: {entry.batch_no=}')
                steel_doc = frappe.get_cached_doc("Steel Batch", entry.batch_no)
                status = ''
                remaining_weight = 0
                remaining_piece = 0
                out_weight = abs(entry.qty)
                if steel_doc.remaining_weight == out_weight:
                    status = '出完'
                else:
                    status = '半出库'
                    remaining_weight = steel_doc.remaining_weight - out_weight
                    # todo 未进行剩余根数的处理
                    out_piece = frappe.db.get_value('Temp Doc Value', 
                                                            {
                                                                'doc_type': 'Stock Entry',
                                                                'doc_name': self.get('name'),
                                                            },
                                                            "data_3")
                    remaining_piece = steel_doc.remaining_piece - cint(out_piece)
                steel_doc.update({
                    "status": status,
                    "remaining_piece": remaining_piece,
                    "remaining_weight": remaining_weight,
                })
                # print_red(f'{steel_doc.as_dict()=}')
    
                steel_doc.save()
                frappe.msgprint(f"原材料状态调整 完成", indicator="green", alert=True)
                

            
            # SABB上重量和三个重量和是否不一样进行报警
            # weight_add = steel_doc.weight + steel_doc.weight2 + steel_doc.weight3
            # if weight_add != item_doc.qty:
            #     frappe.throw(f'{weight_add=} 不同于 {item_doc.qty=}')
            # # print_cyan(f'{vars(steel_doc)=}')

            # frappe.db.commit()
            # print_cyan(f'process end {steel_doc.status=}')
    except Exception as e:
        print("process steel batch error", e)
        frappe.throw(f"调整原材料记录失败：{e}")
    #     traceback.print_exc()



mock_opts = {'name': 'MAT-STE-2024-00197', 'owner': 'Administrator', 'creation': '2024-06-18 09:16:13', 'modified': '2024-06-18 09:16:22', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 0, 'naming_series': 'MAT-STE-.YYYY.-', 'stock_entry_type': '原材料下料出库', 'outgoing_stock_entry': None, 'purpose': 'Bbl Not Op', 'add_to_transit': 0, 'work_order': None, 'purchase_order': None, 'subcontracting_order': None, 'delivery_note_no': None, 'sales_invoice_no': None, 'pick_list': None, 'purchase_receipt_no': None, 'company': '百兰车轴', 'posting_date': '2024-06-18', 'posting_time': '09:16:22.423613', 'set_posting_time': 0, 'inspection_required': 0, 'apply_putaway_rule': 0, 'from_bom': 0, 'use_multi_level_bom': 1, 'bom_no': None, 'fg_completed_qty': 0.0, 'process_loss_percentage': 0.0, 'process_loss_qty': 0.0, 'from_warehouse': None, 'source_warehouse_address': None, 'source_address_display': None, 'to_warehouse': None, 'target_warehouse_address': None, 'target_address_display': None, 'scan_barcode': None, 'total_outgoing_value': 11238.0, 'total_incoming_value': 11238.0, 'value_difference': 0.0, 'total_additional_costs': 0.0, 'supplier': None, 'supplier_name': None, 'supplier_address': None, 'address_display': None, 'project': None, 'select_print_heading': None, 'letter_head': None, 'is_opening': 'No', 'remarks': None, 'per_transferred': 0.0, 'total_amount': 22476.0, 'job_card': None, 'amended_from': None, 'credit_note': None, 'is_return': 0, 'doctype': 'Stock Entry', 'additional_costs': [], 'items': [{'name': 'hfl6t6n5tb', 'owner': 'Administrator', 'creation': '2024-06-18 09:16:13', 'modified': '2024-06-18 09:16:22', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 1, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': '原钢堆场 - 百兰', 't_warehouse': None, 'item_code': 'C50-130', 'item_name': 'C50-130', 'is_finished_item': 0, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': 'C50-130', 'item_group': '原材料', 'image': None, 'qty': 3746.0, 'transfer_qty': 3746.0, 'retain_sample': 0, 'uom': 'Kg', 'stock_uom': 'Kg', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 3.0, 'additional_cost': 0.0, 'valuation_rate': 3.0, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 11238.0, 'amount': 11238.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00000608', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 18724.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00197', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}, {'name': 'hfl6lhs2pm', 'owner': 'Administrator', 'creation': '2024-06-18 09:16:13', 'modified': '2024-06-18 09:16:22', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 2, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': None, 't_warehouse': '短棒料仓 - 百兰', 'item_code': '4E_短棒料', 'item_name': '4E_短棒料', 'is_finished_item': 1, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': '4E_短棒料', 'item_group': '短棒料', 'image': None, 'qty': 35.0, 'transfer_qty': 35.0, 'retain_sample': 0, 'uom': '根', 'stock_uom': '根', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 321.085714286, 'additional_cost': 0.0, 'valuation_rate': 321.085714286, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 11238.0, 'amount': 11238.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00000609', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 0.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00197', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}, {'name': 'hfl6hbqci3', 'owner': 'Administrator', 'creation': '2024-06-18 09:16:13', 'modified': '2024-06-18 09:16:22', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 3, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': None, 't_warehouse': '废料堆场 - 百兰', 'item_code': '原材料头', 'item_name': '原材料头', 'is_finished_item': 0, 'is_scrap_item': 1, 'quality_inspection': None, 'subcontracted_item': None, 'description': '原材料头', 'item_group': '钢材废料', 'image': None, 'qty': 272.0, 'transfer_qty': 272.0, 'retain_sample': 0, 'uom': 'Kg', 'stock_uom': 'Kg', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 0.0, 'additional_cost': 0.0, 'valuation_rate': 0.0, 'allow_zero_valuation_rate': 1, 'set_basic_rate_manually': 0, 'basic_amount': 0.0, 'amount': 0.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': None, 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 0.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00197', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}]}





def create_raw_bar(self):
    print_blue('进入 创建短棒料')
    print(f'{self and self.as_dict() = }')
    # todo 这注入调试数据
    # if frappe.flags.wt_test:
    #     print_red('create_raw_bar, wt_test 测试模式')
    # if frappe.cache.set_value('cache_wt_test', 1)
    # if frappe.cache.get_value('cache_wt_test') or not self :
    if not self :
        print_red('create_raw_bar, cache_wt_test 测试模式 😜')
        self = mock_opts
        
    items = self.get('items')
    last_raw_item = None
    bar_doc = None,
    for item in items:
        if item.get('item_group') == '原材料':
            last_raw_item = item
        elif item.get('item_group') in ['短棒料', '长料头']:
            # print_green_pp(f'{item= }')
            sabb_no = item.get('serial_and_batch_bundle')
            batch_no = frappe.db.get_value('Serial and Batch Entry',
                            {'parent': sabb_no},
                            'batch_no')
            piece = item.get('qty')
            cost = flt(item.get('valuation_rate'), 2)
            # 寻找这个批次，如果存在直接更新数量
            if frappe.db.exists('Short Raw Bar', batch_no):
                print_red('create_raw_bar, 短棒料已存在')
                bar_doc = frappe.get_doc('Short Raw Bar', batch_no)
                # _print_green_pp(bar_doc.as_dict())
                # 更新数量
                bar_doc.update({
                    'cost': cost,
                    'piece': piece,
                    'total_piece': bar_doc.total_piece + piece,
                    'remaining_piece': bar_doc.remaining_piece + piece,
                    'for_date': now(),
                })
            # 如果不存在，创建新的短棒料批次记录
            else :
                print_blue('create_raw_bar, 短棒料不存在')
                temp_dict = frappe._dict({
                    'doctype': 'Short Raw Bar',
                    'warehouse': '短棒料仓 - 百兰',
                    'warehouse_area': '',
                    'for_date': now(),
                })
                temp_dict.raw_bar_name = item.get('item_code')
                temp_dict.semi_product = item.get('item_code').split('_')[0] #避免sb上没有半成品信息
                # temp_dict.cost = flt(item.get('valuation_rate'), 2)
                temp_dict.piece = temp_dict.total_piece = temp_dict.remaining_piece = piece
                temp_dict.batch_no = batch_no
                # 新建短棒料，查询steel batch上的原材料数据
                raw_sabb_no = last_raw_item.get('serial_and_batch_bundle')
                raw_batch_no = frappe.db.get_value('Serial and Batch Entry',
                                        {'parent': raw_sabb_no},
                                        'batch_no')
                # print_red(f'{raw_sabb_no=}')
                # print_red(f'{raw_batch_no=}')
                sb_doc = frappe.get_cached_doc('Steel Batch', raw_batch_no)
                temp_dict.heat_no = sb_doc.heat_no
                temp_dict.raw_name = sb_doc.raw_name
                temp_dict.diameter = sb_doc.diameter
                temp_dict.product_name = '产品名称_备用'
                # 查询Temp Doc Value上存储的临时数据
                temp_dict.length, temp_dict.weight = frappe.db.get_value('Temp Doc Value', 
                                                                         {
                                                                             'doc_type': 'Stock Entry',
                                                                             'doc_name': self.get('name'),
                                                                         },
                                                                         ["data_1", "data_2"])
                # _print_blue_pp(f'{temp_dict=}')
                
                bar_doc = frappe.new_doc(**temp_dict)
                bar_doc.insert(ignore_permissions=True)
        else:
            last_raw_item = None

    
    if bar_doc:
        print_red("dbl commit()")
        bar_doc.save()
        frappe.msgprint(f"增加: {bar_doc.name} 数量: {bar_doc.piece} 成功", indicator="green", alert=True)
        # frappe.db.commit() 
