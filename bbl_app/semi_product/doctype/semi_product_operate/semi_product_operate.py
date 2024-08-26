# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

from bbl_app.utils.frappe_func import make_simi_product_batch_no
import frappe
from frappe.model.document import Document
from frappe.utils import get_fullname
from frappe.utils.data import cint, today

from bbl_api.utils import USERS_IDS, WxcpApp, WxcpGroupTag, _print_blue_pp, print_blue, print_blue_pp, print_green, print_green_pp, print_red, print_yellow, send_wx_msg_q


class SemiProductOperate(Document):
    def save(self):
        print_green("半成品加工单 save")
        return super().save()
    
    def submit(self):
        print_green("半成品加工单 submit")
        # print_blue_pp(self.as_dict())
        self.employee_submit = get_fullname()
        self.voucher_from = self.spm_source
        self.voucher_to = spm_op(self.as_dict())
        return super().submit()
    
    def on_submit(self):
        # print_green("!有效 半成品加工单 on_submit")
        _send_wx_op_info(self)
        # return super().on_submit() # super' object has no attribute 'on_submit
    
    # 可提交文档,提交后不能删除    
    def on_trash(self):
        if ("Administrator" != frappe.session.user ):
            frappe.throw("只有管理员才能删除此文档")
            
    def cancel(self):
        # print_red("半成品加工单 cancel")
        # print(self)
        # frappe.throw("此文档不能取消,可进行转回操作")
        """ 取消 半成品操作单据 逻辑
        1. 检查目标单据是否已经使用,如果已经使用,(and如果建单时间大于2小时)则不能取消
        1.1 如果用户不是本人,则不能取消
        2. 源单据 剩余数量 加上目标单据的剩余数量,
        2.1 如果剩余数量=总数量,is_group = 0;
        3. 删除目标单据。
         """
        if self.semi_op_target and self.semi_op_target.endswith('合批'):
            frappe.throw("合批单据,不能取消")
        from_doc = frappe.get_doc("Semi Product Manage", self.voucher_from)
        to_doc = frappe.get_doc("Semi Product Manage", self.voucher_to)
        if to_doc.status != '未使用':
            frappe.throw("单据已经使用,不能取消")
        # if (now_datetime() - to_doc.creation) > datetime.timedelta(hours = 24):
            # frappe.throw("单据超时,不能取消")
        print_blue("用户:{}".format(frappe.session.user))
        print_blue("用户全名:{}".format(get_fullname()))
        if frappe.session.user != "Administrator" and self.employee_submit != get_fullname():
            frappe.throw("只有本人才能取消")


        # 更新源单据信息
        remaining_piece = from_doc.remaining_piece + to_doc.remaining_piece
        if remaining_piece == from_doc.total_piece:
            # 恢复未使用状态
            from_doc.status = '未使用'
            from_doc.is_group = 0
        else:
            from_doc.status = '已使用'
        from_doc.update({
            'remaining_piece': remaining_piece
        })
        from_doc.save()
        # self.oucher_to = None

        # frappe.throw("此处拦截")
        to_doc.delete(force=True)
        # to_doc.upadate({
        #     'status': '已取消',
        #     'remaining_piece': 0
        # })
        return super().cancel()

def t1():   
    # frappe.get_doc("Semi Product Operate", "SPO-20240820-0009").cancel()
    frappe.get_doc("Semi Product Operate", "SPO-20240821-0001").cancel()

mock_data = {}

# mock_data = {'amended_from': None,
#  'creation': '2024-07-19 17:05:51',
#  'docstatus': 1,
#  'doctype': 'Semi Product Operate',
#  'employee': '我是谁',
#  'employee_submit': '小刘',
#  'finish_name': '4E_探伤',
#  'finish_qty': 24,
#  'for_date': '2024-07-19',
#  'idx': 0,
#  'modified': '2024-07-19 17:05:51',
#  'modified_by': 'Administrator',
#  'name': 'SPO-YYMMDD-0008',
#  'op_flow': None,
#  'owner': 'Administrator',
#  'parent_from': None,
#  'product_name': '4E_锻坯登记',
#  'property_name': None,
#  'property_value': None,
#  'semi_op_source': '锻坯',
#  'semi_op_target': '打磨',
#  'semi_product': '4E',
#  'source_qty': 24,
#  'spm_source': 'DP-4E-V22401504',
#  'test': None}

# mock_data = {'amended_from': None,
#  'basket_in': '',
#  'bbl_heat_no': None,
#  'creation': '2024-08-15 10:51:37',
#  'docstatus': 1,
#  'doctype': 'Semi Product Operate',
#  'employee': 'Administrator',
#  'employee_submit': None,
#  'finish_name': '4E_冷校合批',
#  'finish_qty': 50,
#  'for_date': '2024-08-15',
#  'forge_batch_no': 'pch123456',
#  'idx': 0,
#  'is_merge_batch': 1,
#  'merge_batch': '{"LXZ/LX-240815-4E-02":37,"LXZ/LX-240815-4E-01":8,"LXZ/LX-240814-4E-01":5}',
#  'modified': '2024-08-15 10:51:37',
#  'modified_by': 'Administrator',
#  'name': 'SPO-20240815-0011',
#  'op_flow': None,
#  'op_mark': None,
#  'op_note': None,
#  'owner': 'Administrator',
#  'product_name': '4E_冷校',
#  'property_name': None,
#  'property_value': None,
#  'semi_op_source': '冷校',
#  'semi_op_target': '冷校合批',
#  'semi_product': '4E',
#  'source_qty': 37,
#  'spm_source': 'LXZ/LX-240815-4E-02',
#  'test': None,
#  'voucher_from': None,
#  'voucher_to': None,
#  'workflow_state': None
# }


def spm_op(opts):
    # print_red("spm_op:半成品加工单 处理半成品管理记录 ")
    if not opts:
        print_red("mock data 😁")
        opts = mock_data #置入假数据
    opts = frappe._dict(opts)
    # print_green(opts)
    # 检查目标产品是否有物料名称,没有新建
    _create_item(opts.finish_name)

    # 创建目标产品的 半成品管理记录
    # 减掉 来源产品的 半成品管理记录
    return _semi_product_batch_convert(opts)

    # 是否还需要 生成半成品加的流水账记录（因为本单据就是操作日记性质）
    # frappe.db.commit() # save() 和 submit(提交) 都会自动提交


def _create_item(item_name, item_type = '过程半成品', warehouse = '锻造车间仓库 - 百兰'):
    if (not frappe.db.exists('Item', item_name)):
        target_job = item_name.split('_')[-1]
        product_form_doc = frappe.get_cached_doc('Product Form', target_job)
        # abbr = frappe.db.get_value('Product Form', target_job, 'abbr')
        # warehouse = frappe.db.get_value('Product Form', target_job, 'default_warehouse')
        abbr = product_form_doc.abbr
        warehouse = product_form_doc.default_warehouse
        new_doc = frappe.get_doc({
            'doctype': 'Item',
            'item_code': item_name,
            "item_group": item_type,
            "stock_uom": "根",
            'has_batch_no': 1,
            'create_new_batch': 1,
            'batch_number_series': abbr + '.#########',
            "default_material_request_type": "Manufacture",
            "weight_uom": "kg",
            "is_purchase_item": 0,
            "item_defaults": [
                { 
                    "default_warehouse": warehouse,
                }
            ]
        })
        new_doc.insert(ignore_permissions=True)
        # frappe.db.commit()
        # frappe.msgprint(f"新建{frappe.bold('锻坯')} {item_name}", indicator="green", alert=True)
        return new_doc
    else: 
        return frappe.get_cached_doc("Item", item_name)


def _semi_product_batch_convert(opts):
    # if frappe.flags.wt_t1:
    #     bar_item = frappe._dict(bar_item)
    semi_doc_source = frappe.get_doc('Semi Product Manage', opts.spm_source)
    semi_doc_target = frappe.copy_doc(semi_doc_source, False)
    item_name = opts.finish_name
    semi_product_name, target_product_form = item_name.rsplit('_', 1)
    
    product_form_doc = frappe.get_cached_doc('Product Form', target_product_form)
    target_abbr = product_form_doc.abbr
    # batch_no = abbr + getseries(abbr, 3)
    # batch_no = parse_naming_series(target_abbr + '-.YY.MM.DD.-.###')
    batch_no = make_simi_product_batch_no(semi_product_name, target_abbr)
    # print_red(f'{product_form_doc=} {batch_no=} {semi_product_name=}')

    # basket_no有新使用的,清除掉其它使用次框号的
    if (opts.basket_in):
        # frappe.db.sql(f"update `tabSemi Product Manage` set basket_no = '' where basket_no = '{opts.basket_in}' and name != '{opts.spm_source}'")
        frappe.db.sql(f"update `tabSemi Product Manage` set basket_no = '' where basket_no = '{opts.basket_in}' ")

    # 新doc设置 件数,剩余数量,总数量,操作员,产品名称,批次号（自动？）
    #   仓库（根据目标产品形态设置）,状态（缺省未使用）,
    is_sub_form = target_product_form in semi_doc_source.op_list.split('-') or product_form_doc.is_sub_form
    yield_operation = opts.yield_operation
    yield_list = semi_doc_source.yield_list or ''
    if (yield_operation and not yield_operation in yield_list.split('-')):
        semi_doc_target.yield_list = yield_list + '-' + yield_operation if yield_list else yield_operation
    print_red(f'{semi_doc_target.yield_list=}')


    is_merge_batch = opts.is_merge_batch
    merge_batch= {}
    if is_merge_batch:
        merge_batch= frappe.parse_json(opts.merge_batch)
        merge_qty = cint(opts.finish_qty)
        batch_qts_total = sum([cint(v) for v in merge_batch.values()])
        if merge_qty != batch_qts_total:
            frappe.throw(f'合并批次数量不匹配 {merge_qty=} {batch_qts_total=}')
    #     print_red(f'{merge_batch=}')
    #     print_red(f'批次数量匹配 {merge_qty=} {batch_qts_total=}')
        

    # print_red(f' {is_merge_batch=}')

    semi_doc_target.update({
        'batch_no': batch_no,
        'last_in_piece': opts.finish_qty,
        'remaining_piece': opts.finish_qty,
        'total_piece': opts.finish_qty,
        'semi_product_name': opts.finish_name,
        'employee': opts.employee,
        'product_form': target_product_form,
        'forge_batch_no': opts.forge_batch_no or semi_doc_source.forge_batch_no,
        'bbl_heat_no': opts.bbl_heat_no or semi_doc_source.bbl_heat_no,
        'basket_in': opts.basket_in,
        'basket_no': opts.basket_in,
        'bbl_heat_no': opts.bbl_heat_no,
        'note': opts.op_note,
        'op_times': semi_doc_source.op_times + 1,
        'op_list': semi_doc_source.op_list + '-' + target_product_form,
        'last_op_voucher': opts.name,
        # 'parent_batch_no': opts.spm_source,
        'parent_semi_product_manage': opts.spm_source,
        'old_parent': opts.spm_source,
        # 'status': '未使用', # default
        'op_mark': opts.op_mark,
        'production_line': opts.production_line,
        'for_date': opts.for_date,
        'operation': product_form_doc.operation,
        'product_grade': product_form_doc.product_grade,
        'workshop': product_form_doc.workshop,
        'sub_workshop': product_form_doc.sub_workshop,
        'warehouse': product_form_doc.warehouse,
        'is_over': product_form_doc.is_over,
        'is_sub_form': is_sub_form,
        'is_merge_batch': is_merge_batch,
        'merge_batch': opts.merge_batch,

    }).insert(ignore_permissions=True)
    
    source_remaining = semi_doc_source.remaining_piece - opts.finish_qty
    source_status = '用完' if source_remaining == 0 else '已使用'
    if source_remaining < 5 and source_remaining != 0:
        source_status = '余料' 
    
    if (not is_merge_batch):
        # 非合批批次
        semi_doc_source.update({
            'last_in_piece': 0,
            'last_out_piece': opts.finish_qty,
            'remaining_piece': source_remaining,
            'use_date': today(),
            'status': source_status,
            'last_op_voucher': opts.name,
            'basket_no': semi_doc_source.basket_in if source_remaining != 0 else '',
            'basket_in': semi_doc_source.basket_in if source_remaining != 0 else '',
            'is_group': 1,
        }).save()
    else:   
        # 合批批次操作
        for batch_name, batch_qty in merge_batch.items():
            print_red(f'{batch_name=}: {batch_qty=}')
            is_group = 1 if (batch_name == opts.spm_source) else 0
            print_yellow(f'{is_group=}')
            # semi_doc_source = frappe.get_doc('Semi Product Manage', opts.spm_source)
            frappe.db.set_value('Semi Product Manage', batch_name,
                                {
                                    'last_in_piece': 0,
                                    'last_out_piece': batch_qty,
                                    'remaining_piece': 0,
                                    'use_date': today(),
                                    'status': "合批",
                                    'last_op_voucher': opts.name,
                                    'basket_no': '',
                                    'basket_in': '',
                                    'is_group': is_group,
                                })

    # frappe.db.commit()
    # return (new_spm_name, is_yield, yield_operation)
    # print_blue_pp(semi_doc_source.as_dict())
    # print_green_pp(semi_doc_target.as_dict())   
    return semi_doc_target.name


def _send_wx_op_info(spo):
    spo = frappe.get_last_doc('Semi Product Operate')
    # _print_blue_pp(spo.as_dict())
    rt_str = (
        ' --- 半成品加工信息 ---\n'
        # '------\n'
        f'批次号: {spo.voucher_to}\n'
        f'批次名称: {spo.finish_name}\n'
        # f'半成品: {spo.semi_product}\n'
        f'锻造标识: {spo.forge_batch_no}\n'
        f'加工数量: {spo.finish_qty} 根\n'
        f'剩余数量: {spo.source_qty - spo.finish_qty} 根\n'
        # '------\n'
        # f'时间: {spo.modified.strftime("%Y-%m-%d %H:%M:%S")}\n'
        f'生产员工: {spo.employee}'
    )
    # _print_blue_pp(rt_str)
    # send_wx_msg_q(rt_str, now=True, app_name=WxcpApp.PRODUCT_APP.value)
    # send_wx_msg_q(rt_str, app_name=WxcpApp.PRODUCT_APP.value)
    # send_wx_msg_q(rt_str, app_name=WxcpApp.PRODUCT_APP.value, user_ids=USERS_IDS.get('semi_product_operate'))
    send_wx_msg_q(rt_str, app_name=WxcpApp.PRODUCT_APP.value, tag_ids=WxcpGroupTag.SEMI_PRODUCT_OPERATE.value)


""" test info
import bbl_app.semi_product.doctype.semi_product_operate.semi_product_operate as spo
spo.spm_op(None)
spo.t1()
d = frappe.get_last_doc('Semi Product Operate')
spo._send_wx_op_info(d)

sb.clear_db()
"""
