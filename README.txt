# Verdulería — estructura PC / Mobile / Admin

- /pc/      -> versión escritorio (assets propios dentro de /pc)
- /mobile/  -> versión móvil (assets propios dentro de /mobile)
- /admin/   -> panel administrativo
- /index.php -> redirección automática por dispositivo

Tips:
- Forzar vista:
  - /index.php?view=pc
  - /index.php?view=mobile

Nota: GitHub Pages NO ejecuta PHP. Para usar index.php necesitás hosting con PHP (InfinityFree, etc).
En GitHub Pages podés entrar directo a /mobile/ o /pc/.
