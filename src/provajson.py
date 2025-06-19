vertices = [
    (0, 0),
    (1, 0),
    (0, 0),  # Dupliato
    (2, 2),
    (0, 0),  # Dupliato ancroa
]
# Risultato aspettatato:
# - vertices = [(0,0),(1,0),(2,2)]
# - indies = [0,1,0,0,2]

l = []
unique = {}
cnt = 0
for vert in vertices:
    if vert not in unique:
        unique[vert] = cnt
        cnt += 1
    l.append(unique[vert])

print(l, list(unique.keys()))
