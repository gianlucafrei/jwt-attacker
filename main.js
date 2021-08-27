
        const jwtRegex = /(ey[A-Za-z0-9-_]*)(\.)(ey[A-Za-z0-9-_]*)(\.)([A-Za-z0-9-_]*)/m;

        function getJwt(jwtText){
            
            try{
                let match = jwtText.match(jwtRegex);

                if(!match)
                    return undefined;

                jwtTxt = match[0];
                headerTxt = match[1];
                payloadTxt = match[3];
                signTxt = match[5];
        
                header = JSON.parse(atob(headerTxt));
                payload = JSON.parse(atob(payloadTxt));
            }
            catch{
                return undefined;
            }
            
    
            
    
            return {
                jwtTxt: jwtTxt,
                headerTxt: headerTxt,
                header: header,
                payloadTxt: payloadTxt,
                payload: payload,
                signTxt: signTxt
            }
        }
    
        function highlightJwt(jwtText){
    
            let match = jwtText.match(jwtRegex);
            if(! match) return jwtText;
    
            let completeJwt = match[0];
            let jwtHeader = match[1];
            let jwtPayload = match[3];
            let jwtSignature = match[5];
    
            let jwtStartIndex = jwtText.indexOf(completeJwt);
            let jwtEndIndex = jwtStartIndex + completeJwt.length;
    
            let prefix = jwtText.substring(0, jwtStartIndex);
            let postfix = jwtText.substring(jwtEndIndex, jwtText.length);
    
            jwtHtml = prefix;
            jwtHtml += '<span class="jwtHeader">' + jwtHeader + '</span>' + '.';
            jwtHtml += '<span class="jwtPayload">' + jwtPayload + '</span>' + '.';
            jwtHtml += '<span class="jwtSign">' + jwtSignature + '</span>';
            jwtHtml += postfix;
            return jwtHtml;
        }
    
        function inputJwtChanged(jwtInput){
    
            let decodedToken = "invalid token";
            let jwt = getJwt(jwtInput);
            if(jwt){
                console.log("JWT:" + jwt)
    
                decodedToken = JSON.stringify(jwt.header, null, 2) + ".\n" + JSON.stringify(jwt.payload, null, 2) + "\n." + jwt.signTxt;
            }

            // Update claims editor
            let claimsEditor = document.querySelector("#jwt-claims-editor");
            claimsEditor.value = decodedToken;
            update(claimsEditor, 'jwt-claims-content', inputClaimsChanged);
    
            return highlightJwt(jwtInput);
        }
    
        function parseClaims(claimsInput){
            var bracketsCounter = 0;
    
            var parsingResult = {
                openings: [],
                closings: []
            };
    
            for (var i = 0; i < claimsInput.length; i++) {
    
                var char = claimsInput.charAt(i);
    
                if(char == "{"){
                    bracketsCounter += 1;
                    if(bracketsCounter == 1){
                        // this is a opening
                        parsingResult.openings.push(i);
                    }
                }
                    
                if(char == "}"){
                    bracketsCounter -= 1;
                    if(bracketsCounter == 0){
                        // this is a opening
                        parsingResult.closings.push(i+1);
                    }
                }
            }

            var prefix, headerTxt, separator, claimsTxt, postfix;

            if(parsingResult.openings.length == 2 && parsingResult.closings.length==2){
                prefix = claimsInput.substring(0, parsingResult.openings[0]);
                headerTxt = claimsInput.substring(parsingResult.openings[0], parsingResult.closings[0]);
                separator = claimsInput.substring(parsingResult.closings[0], parsingResult.openings[1]);
                claimsTxt = claimsInput.substring(parsingResult.openings[1], parsingResult.closings[1]);
                postfix = claimsInput.substring(parsingResult.closings[1], claimsInput.length);
            }
            else{
                
                return undefined;
            }
    
            return {
                headerTxt: headerTxt,
                claimsTxt: claimsTxt,
                prefix: prefix,
                separator: separator,
                postfix: postfix
            }
        }
    
        function jwtEncode(obj){
            
            var json = JSON.stringify(obj);
            var base64 = btoa(json);
            var base64url = base64.replace(/\+/g, '-').replace(/\//g, '_');
            
            // Strip ending =
            return base64url.replace(/=/g, '');
        }
    
        function createForgedToken(claimsObj){
            
            var originalInput = document.getElementById("jwt-input-editor").value;
            var originalJwt = getJwt(originalInput);

            var header = null;
            var claims = null;
            var signature;
    
            try {
                header = JSON.parse(claimsObj.headerTxt);
                claims = JSON.parse(claimsObj.claimsTxt);
            }
            catch (e) {
                return "invalid token"
            }
    
            if(document.querySelector("#noneAlgoMethod").checked){
                header.alg = "none";
                signature = "";
            }
            if(document.querySelector("#keepSignMethod").checked){
                signature = originalJwt.signTxt;
            }
    
            var headerEncoded = jwtEncode(header);
            var claimsEncoded = jwtEncode(claims);
            var token = headerEncoded + "." + claimsEncoded + "." + signature;
            return token;
        }
    
        function inputClaimsChanged(claimsInput){
            
            // Remove all newlines and spaces
            var claims = parseClaims(claimsInput);

            if(! claims)
                return claimsInput;
    
            var claimsHtml = claims.prefix;
            claimsHtml += '<span class="jwtHeader">' + claims.headerTxt + '</span>';
            claimsHtml += claims.separator;
            claimsHtml += '<span class="jwtPayload">' + claims.claimsTxt + '</span>';
            claimsHtml += '<span class="jwtSign">' + claims.postfix + '</span>';
    
            var forgedToken = createForgedToken(claims);
        
    
            let outputEditor = document.querySelector("#jwt-output-editor");
            outputEditor.value = forgedToken;
            update(outputEditor, 'jwt-output-content', outputJwtChanged);
    
            return claimsHtml;
        }
    
        function outputJwtChanged(jwtInput){
            return highlightJwt(jwtInput);
        }
        
        // Text field functions
        function update(element, outputId, updateCallback) {
    
            let text = element.value;
            let result_element = document.querySelector("#" + outputId);
            // Handle final newlines
            if(text[text.length-1] == "\n") {
                text += " ";
            }
            // Update code
            html = text.replace(new RegExp("&", "g"), "&amp;").replace(new RegExp("<", "g"), "&lt;");
            html = updateCallback(html);
            result_element.innerHTML = html;
        }
    
        function sync_scroll(element, outputId) {
            /* Scroll result to scroll coords of event - sync with textarea */
            let result_element = document.querySelector("#" + outputId);
            // Get and set x and y
            result_element.scrollTop = element.scrollTop;
            result_element.scrollLeft = element.scrollLeft;
        }
    
        function check_tab(element, event) {
            let code = element.value;
            if(event.key == "Tab") {
                /* Tab key pressed */
                event.preventDefault(); // stop normal
                let before_tab = code.slice(0, element.selectionStart); // text before tab
                let after_tab = code.slice(element.selectionEnd, element.value.length); // text after tab
                let cursor_pos = element.selectionEnd + 2; // after tab placed, where cursor moves to - 2 for 2 spaces
                element.value = before_tab + "  " + after_tab; // add tab char - 2 spaces
                // move cursor
                element.selectionStart = cursor_pos;
                element.selectionEnd = cursor_pos;
                update(element.value); // Update text to include indent
            }
        }
    
        function updateMethod(){
    
            let claimsEditor = document.querySelector("#jwt-claims-editor");
            update(claimsEditor, 'jwt-claims-content', inputClaimsChanged);
        }
    
update(document.querySelector("#jwt-input-editor"), 'jwt-input-content', inputJwtChanged);    