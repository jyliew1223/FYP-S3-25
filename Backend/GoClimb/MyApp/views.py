from django.shortcuts import render

def home(request):
    return render(request, "MyApp/Website/index.html")
