import os
import re

directory = r'c:\Users\thaiv\CODE\LoFilm\lofilm\app'

# Matches `/api/proxy?url=${encodeURIComponent( <anything> )}` optionally followed by `&revalidate=...`
# We use a non-greedy match for the inner content, but we have to be careful with nested parentheses.
# Since JS expressions can have nested parens (though rare in this specific grep), let's just match everything up to `)}` where the wrapper ends.
# Actually, the grep shows all of them end cleanly with `)}` or `)}&revalidate=...` before the closing backtick.
pattern = re.compile(r'`/api/proxy\?url=\$\{encodeURIComponent\((.*?)\)\}(?:(?:&|\?)revalidate=\d+)?`')

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(r'\1', content)

            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
