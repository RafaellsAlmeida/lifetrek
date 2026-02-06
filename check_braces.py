import os

def check_balance(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    stack = []
    errors = []
    
    for line_num, line in enumerate(lines, 1):
        for char_pos, char in enumerate(line):
            if char in '{[(':
                stack.append((char, line_num, char_pos))
            elif char in '}])':
                if not stack:
                    errors.append(f"Unexpected '{char}' at {filepath}:{line_num}:{char_pos}")
                    # Continue searching to find more errors? Or stop?
                    # Usually one error cascades. But showing it is useful.
                else:
                    last, last_line, last_pos = stack.pop()
                    expected = '{' if char == '}' else '[' if char == ']' else '('
                    if last != expected:
                        errors.append(f"Mismatched '{char}' at {filepath}:{line_num}:{char_pos}. Expected closing for '{last}' from {last_line}:{last_pos}")
    
    if stack:
        first_unclosed = stack[0]
        errors.append(f"Unclosed '{first_unclosed[0]}' from {filepath}:{first_unclosed[1]}:{first_unclosed[2]}")
        
    return errors

rootDir = 'src/components/admin/content'
for dirName, subdirList, fileList in os.walk(rootDir):
    for fname in fileList:
        if fname.endswith('.tsx'):
            path = os.path.join(dirName, fname)
            errs = check_balance(path)
            for e in errs:
                print(e)
