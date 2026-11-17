#!/usr/bin/env python
"""把 src/ 裡的頁面組成可以直接發布的版本：樣式表和程式直接寫進每一頁。

為什麼要這樣做：有同學的 Android 手機打開網站時整頁沒有排版，也就是外部的樣式檔沒有套用到。
把樣式和程式內嵌之後，只要頁面本身載得到，排版、目錄、圖表就一定在，不再依賴第二次下載。
（數學式的 KaTeX 和字型仍然從 CDN 載入；載不到時數學式會顯示成原始的 LaTeX 文字。）

用法：改完 src/ 裡的檔案之後執行  python build.py  ，再把產生的頁面一起 commit。
"""
import glob
import io
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')


def read(path):
    return io.open(path, encoding='utf-8').read()


def main():
    css = read(os.path.join(SRC, 'assets', 'style.css'))
    # 內嵌的程式裡不能出現 </script，否則瀏覽器會以為程式到這裡結束
    js = read(os.path.join(SRC, 'assets', 'app.js')).replace('</script', r'<\/script')
    assert '</style' not in css
    pages = sorted(glob.glob(os.path.join(SRC, '*.html')))
    for path in pages:
        html = read(path)
        html, n_css = re.subn(r'<link rel="stylesheet" href="assets/style\.css(\?v=\d+)?">',
                              lambda m: '<style>\n' + css + '</style>', html)
        html, n_js = re.subn(r'<script defer src="assets/app\.js(\?v=\d+)?"></script>',
                             lambda m: '<script>\n' + js + '</script>', html)
        if n_css != 1 or n_js != 1:
            raise SystemExit('%s：找不到樣式或程式的引用（css %d、js %d）' % (path, n_css, n_js))
        html = html.replace('<!doctype html>',
                            '<!doctype html>\n<!-- 這個檔案由 build.py 產生，請修改 src/ 裡的原始檔再重新產生 -->', 1)
        out = os.path.join(ROOT, os.path.basename(path))
        io.open(out, 'w', encoding='utf-8', newline='\n').write(html)
        print('%-14s %6.1f KB' % (os.path.basename(path), len(html.encode('utf-8')) / 1024))
    print('完成：%d 頁' % len(pages))


if __name__ == '__main__':
    main()
