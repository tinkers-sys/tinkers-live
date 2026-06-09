Option Explicit

' Requires Microsoft XML, v6.0 and Microsoft Scripting Runtime references

Dim cart
Set cart = CreateObject("Scripting.Dictionary")

Function FormatCurrencyZAR(amount)
    FormatCurrencyZAR = "R" & FormatNumber(amount, 2, vbTrue, vbFalse, vbTrue)
End Function

Function LoadProducts()
    Dim http, json, products, i, p, dict, stockVal
    Set products = CreateObject("Scripting.Dictionary")
    Set http = CreateObject("MSXML2.XMLHTTP.6.0")
    http.Open "GET", "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1", False
    http.Send
    If http.Status <> 200 Then
        Err.Raise vbObjectError + 1, , "Fetch failed"
    End If
    Dim responseText
    responseText = http.responseText

    Set json = ParseJson(responseText)
    For i = 0 To json.Count - 1
        Set p = json(i)
        stockVal = 0
        If IsNumeric(p("stock")) Then
            stockVal = CInt(p("stock"))
        End If
        Dim prod
        Set prod = CreateObject("Scripting.Dictionary")
        prod.Add "id", p("id")
        prod.Add "name", p("name")
        prod.Add "price", CDbl(p("price"))
        prod.Add "image", p("image")
        If IsEmpty(p("category")) Or IsNull(p("category")) Then
            prod.Add "category", ""
        Else
            prod.Add "category", LCase(p("category"))
        End If
        prod.Add "stock", stockVal
        products.Add p("id"), prod
    Next
    Set LoadProducts = products
End Function

Function BuildCard(p)
    Dim stockText, disabled, html
    stockText = ""
    disabled = ""
    If p("stock") <= 0 Then
        stockText = "<p style='color:red;'>Out of Stock</p>"
        disabled = "disabled"
    ElseIf p("stock") <= 3 Then
        stockText = "<p style='color:red;'>Only " & p("stock") & " left 🔥</p>"
    ElseIf p("stock") <= 5 Then
        stockText = "<p style='color:orange;'>Low stock (" & p("stock") & ")</p>"
    End If

    html = "<div class=""product-card"">" & _
           "<img src=""images/" & p("image") & """>" & _
           "<h3>" & p("name") & "</h3>" & _
           "<p>" & FormatCurrencyZAR(p("price")) & "</p>" & _
           stockText & _
           "<button onclick=""AddToCart '" & p("id") & "','" & p("name") & "'," & p("price") & ",'" & p("image") & "'," & p("stock") & """ " & disabled & ">" & _
           "Add to cart</button>" & _
           "</div>"
    BuildCard = html
End Function

Sub AddToCart(id, name, price, image, stock)
    Dim itemKey, item
    itemKey = id
    If cart.Exists(itemKey) Then
        Set item = cart(itemKey)
        If item("qty") >= stock Then
            MsgBox "Stock limit reached", vbExclamation
            Exit Sub
        End If
        item("qty") = item("qty") + 1
        cart(itemKey) = item
    Else
        Dim newItem
        Set newItem = CreateObject("Scripting.Dictionary")
        newItem.Add "id", id
        newItem.Add "name", name
        newItem.Add "price", price
        newItem.Add "image", image
        newItem.Add "qty", 1
        newItem.Add "stock", stock
        cart.Add itemKey, newItem
    End If
    SaveCart
End Sub

Sub SaveCart()
    Dim fso, file, jsonText
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set file = fso.CreateTextFile("cart.json", True)
    jsonText = JsonStringifyCart(cart)
    file.Write jsonText
    file.Close
    UpdateCartUI
End Sub

Sub UpdateCartUI()
    Dim total, count, key, item
    total = 0
    count = 0
    For Each key In cart.Keys
        Set item = cart(key)
        total = total + item("price") * item("qty")
        count = count + item("qty")
    Next
    ' Assuming you have a way to update UI elements in your environment
    ' For example, if using HTA or IE automation:
    ' document.querySelector(".cart-count").innerText = count
    ' document.getElementById("cartTotal").innerText = FormatCurrencyZAR(total)
End Sub

Sub SetupFilters(products)
    ' This is a placeholder: VBScript does not handle DOM events like JS
    ' You would need to implement UI event handling in your environment
End Sub

' JSON parsing and stringifying functions (simple versions)
Function ParseJson(jsonText)
    Dim sc, result
    Set sc = CreateObject("ScriptControl")
    sc.Language = "JScript"
    sc.AddCode "function parse(json){return JSON.parse(json);}"
    Set result = sc.Run("parse", jsonText)
    Set ParseJson = result
End Function

Function JsonStringifyCart(cartDict)
    Dim sc, arr, key, item, jsonStr
    Set sc = CreateObject("ScriptControl")
    sc.Language = "JScript"
    Set arr = CreateObject("Scripting.Dictionary")
    Dim items()
    ReDim items(cartDict.Count - 1)
    Dim i: i = 0
    For Each key In cartDict.Keys
        Set item = cartDict(key)
        Dim obj
        Set obj = CreateObject("Scripting.Dictionary")
        obj.Add "id", item("id")
        obj.Add "name", item("name")
        obj.Add "price", item("price")
        obj.Add "image", item("image")
        obj.Add "qty", item("qty")
        obj.Add "stock", item("stock")
        items(i) = obj
        i = i + 1
    Next
    sc.AddObject "items", items
    jsonStr = sc.Eval("JSON.stringify(items)")
    JsonStringifyCart = jsonStr
End Function
