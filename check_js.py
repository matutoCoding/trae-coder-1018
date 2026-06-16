import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

open_paren = content.count('(')
close_paren = content.count(')')
open_brace = content.count('{')
close_brace = content.count('}')
open_bracket = content.count('[')
close_bracket = content.count(']')

print(f'括号检查: (): {open_paren}/{close_paren} {{}}: {open_brace}/{close_brace} []: {open_bracket}/{close_bracket}')

if open_paren != close_paren:
    print('错误: 括号不匹配!')
if open_brace != close_brace:
    print('错误: 花括号不匹配!')
if open_bracket != close_bracket:
    print('错误: 方括号不匹配!')

single_quotes = content.count("'")
double_quotes = content.count('"')
print(f'引号检查: 单引号: {single_quotes}, 双引号: {double_quotes}')

template_strings = len(re.findall(r'`', content))
print(f'模板字符串: {template_strings}个')
if template_strings % 2 != 0:
    print('警告: 模板字符串反引号可能不配对!')

print('基本语法检查完成')
