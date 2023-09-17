AMPA
====

Simple tool to report blood pressure and heart rate measurements to my doctor.

It is intended to take measurements at the morning and early night every two
weeks so, if at given day, there is only a morning ot night measurement, it
will automatically leave blanks in appropriate rows.

...except if the missing measurement is taken in the next one or twho days, in
which case it will be understood as an ammendment attempt.

USAGE
-----

```sh
npx ampa data_file.txt > report.html
```

data_file.txt format
--------------------

Data_file.txt accept three kind of rows:

  * Property name and value pairs (format "name: value...")

  * Data measurement rows with following (space-separated) columns:
    - Date (in YYYYMMDD format).
    - Hour (in HHMM format).
    - Systole value.
    - Diástole value.
    - Heart Rate value.
    
  * Blank rows (which are ignored).

**Example:**

```
doctor: Dr. Julius Hibbert
patient: Hommer Simpson

20220612 2230 121 82 88
20220702 0942 116 79 70
```

